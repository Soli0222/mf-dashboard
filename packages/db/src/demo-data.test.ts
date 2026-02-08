import { eq, and, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
/**
 * デモデータ整合性テスト
 *
 * PostgreSQL上のデモデータの整合性を確認する。
 * - グループとアカウントの紐付け
 * - 振替トランザクションのtransferTargetAccountId
 * - 資産合計の整合性
 * - グループ外振替の検出
 */
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import * as schema from "./schema/schema";

const databaseUrl = process.env.DATABASE_URL;

// DATABASE_URLが設定されていない場合はスキップ
const dbAvailable = !!databaseUrl;

describe.skipIf(!dbAvailable)("demo.db 整合性テスト", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe("グループ構成", () => {
    test("3つのグループが存在する", async () => {
      const groups = await db.select().from(schema.groups);
      expect(groups).toHaveLength(3);

      const names = groups.map((g) => g.name);
      expect(names).toContain("グループ選択なし");
      expect(names).toContain("投資");
      expect(names).toContain("生活");
    });

    test("グループ選択なしがisCurrent=trueである", async () => {
      const currentGroup = (
        await db.select().from(schema.groups).where(eq(schema.groups.isCurrent, true))
      )[0];
      expect(currentGroup).toBeDefined();
      expect(currentGroup?.name).toBe("グループ選択なし");
    });

    test("全アカウントがグループ選択なしに所属している", async () => {
      const allAccounts = await db.select().from(schema.accounts);
      const noGroupId = (
        await db.select().from(schema.groups).where(eq(schema.groups.name, "グループ選択なし"))
      )[0]!.id;

      const groupAccountIds = (
        await db
          .select({ accountId: schema.groupAccounts.accountId })
          .from(schema.groupAccounts)
          .where(eq(schema.groupAccounts.groupId, noGroupId))
      ).map((ga) => ga.accountId);

      for (const acc of allAccounts) {
        expect(groupAccountIds).toContain(acc.id);
      }
    });
  });

  describe("振替トランザクション", () => {
    test("振替トランザクションにtransferTargetAccountIdが設定されている", async () => {
      const transfers = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.isTransfer, true));

      expect(transfers.length).toBeGreaterThan(0);

      // transferTargetがあるものはtransferTargetAccountIdも設定されているべき
      const withTarget = transfers.filter((t) => t.transferTarget !== null);
      for (const t of withTarget) {
        expect(t.transferTargetAccountId).not.toBeNull();
      }
    });

    test("transferTargetAccountIdは有効なアカウントIDである", async () => {
      const transfers = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.isTransfer, true),
            isNotNull(schema.transactions.transferTargetAccountId),
          ),
        );

      const accountIds = (await db.select({ id: schema.accounts.id }).from(schema.accounts)).map(
        (a) => a.id,
      );

      for (const t of transfers) {
        expect(accountIds).toContain(t.transferTargetAccountId);
      }
    });

    test("ゆうちょ銀行からの振替が存在する", async () => {
      // ゆうちょ銀行（貯蓄用）のIDを取得
      const yuchoAccount = (
        await db
          .select()
          .from(schema.accounts)
          .where(sql`${schema.accounts.name} LIKE '%ゆうちょ銀行%'`)
      )[0];

      expect(yuchoAccount).toBeDefined();

      // ゆうちょ銀行（account_id）からの振替を検索
      const transfersFromYucho = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.isTransfer, true),
            eq(schema.transactions.accountId, yuchoAccount!.id),
          ),
        );

      expect(transfersFromYucho.length).toBeGreaterThan(0);
    });
  });

  describe("グループ外振替（収入変換対象）", () => {
    test("生活グループにはゆうちょ銀行が含まれない", async () => {
      const livingGroup = (
        await db.select().from(schema.groups).where(eq(schema.groups.name, "生活"))
      )[0];

      expect(livingGroup).toBeDefined();

      const livingAccountIds = (
        await db
          .select({ accountId: schema.groupAccounts.accountId })
          .from(schema.groupAccounts)
          .where(eq(schema.groupAccounts.groupId, livingGroup!.id))
      ).map((ga) => ga.accountId);

      const yuchoAccount = (
        await db
          .select()
          .from(schema.accounts)
          .where(sql`${schema.accounts.name} LIKE '%ゆうちょ銀行%'`)
      )[0];

      expect(yuchoAccount).toBeDefined();
      expect(livingAccountIds).not.toContain(yuchoAccount!.id);
    });

    test("生活グループ視点でグループ外振替が存在する", async () => {
      const livingGroup = (
        await db.select().from(schema.groups).where(eq(schema.groups.name, "生活"))
      )[0];
      expect(livingGroup).toBeDefined();

      const livingAccountIds = new Set(
        (
          await db
            .select({ accountId: schema.groupAccounts.accountId })
            .from(schema.groupAccounts)
            .where(eq(schema.groupAccounts.groupId, livingGroup!.id))
        ).map((ga) => ga.accountId),
      );

      // 生活グループ内のアカウントに紐づく振替で、transferTargetがグループ外のもの
      const transfers = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.isTransfer, true),
            isNotNull(schema.transactions.transferTargetAccountId),
          ),
        );

      const outsideGroupTransfers = transfers.filter((t) => {
        const isAccountInGroup = livingAccountIds.has(t.accountId!);
        const isTargetOutsideGroup = !livingAccountIds.has(t.transferTargetAccountId!);
        return isAccountInGroup && isTargetOutsideGroup;
      });

      expect(outsideGroupTransfers.length).toBeGreaterThan(0);
    });
  });

  describe("資産整合性", () => {
    test("holdingValuesの合計がassetHistoryの最終日と一致する", async () => {
      const groups = await db.select().from(schema.groups);

      for (const group of groups) {
        // グループの最新スナップショットを取得
        const snapshot = (
          await db
            .select()
            .from(schema.dailySnapshots)
            .where(eq(schema.dailySnapshots.groupId, group.id))
            .orderBy(sql`${schema.dailySnapshots.date} DESC`)
            .limit(1)
        )[0];

        if (!snapshot) continue;

        // holdingValuesの合計
        const holdingTotal = (
          await db
            .select({ total: sql<number>`SUM(${schema.holdingValues.amount})` })
            .from(schema.holdingValues)
            .innerJoin(schema.holdings, eq(schema.holdingValues.holdingId, schema.holdings.id))
            .where(eq(schema.holdingValues.snapshotId, snapshot.id))
        )[0];

        // assetHistoryの最終日
        const latestAssetHistory = (
          await db
            .select()
            .from(schema.assetHistory)
            .where(eq(schema.assetHistory.groupId, group.id))
            .orderBy(sql`${schema.assetHistory.date} DESC`)
            .limit(1)
        )[0];

        if (holdingTotal?.total && latestAssetHistory) {
          // 資産のみの合計を比較（負債は除く）
          const assetHoldingTotal = (
            await db
              .select({ total: sql<number>`SUM(${schema.holdingValues.amount})` })
              .from(schema.holdingValues)
              .innerJoin(schema.holdings, eq(schema.holdingValues.holdingId, schema.holdings.id))
              .where(
                and(
                  eq(schema.holdingValues.snapshotId, snapshot.id),
                  eq(schema.holdings.type, "asset"),
                ),
              )
          )[0];

          expect(assetHoldingTotal?.total).toBe(latestAssetHistory.totalAssets);
        }
      }
    });

    test("アカウントごとのholdingが存在する", async () => {
      const accounts = await db.select().from(schema.accounts);

      // 携帯・通販など取引のみで資産を持たないアカウントは除外
      const accountsWithExpectedHoldings = accounts.filter(
        (a) => !["ahamo", "Amazon.co.jp"].includes(a.name),
      );

      for (const acc of accountsWithExpectedHoldings) {
        const holdings = await db
          .select()
          .from(schema.holdings)
          .where(eq(schema.holdings.accountId, acc.id));

        expect(holdings.length).toBeGreaterThan(0);
      }
    });
  });

  describe("トランザクション整合性", () => {
    test("収入・支出トランザクションにカテゴリが設定されている", async () => {
      const incomeExpense = await db
        .select()
        .from(schema.transactions)
        .where(sql`${schema.transactions.type} IN ('income', 'expense')`);

      for (const tx of incomeExpense) {
        expect(tx.category).not.toBeNull();
      }
    });

    test("振替トランザクションはisExcludedFromCalculation=trueである", async () => {
      const transfers = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.type, "transfer"));

      for (const tx of transfers) {
        expect(tx.isExcludedFromCalculation).toBe(true);
      }
    });

    test("月次データが連続している", async () => {
      const months = (
        await db
          .select({ month: sql<string>`SUBSTR(${schema.transactions.date}, 1, 7)` })
          .from(schema.transactions)
          .groupBy(sql`SUBSTR(${schema.transactions.date}, 1, 7)`)
          .orderBy(sql`SUBSTR(${schema.transactions.date}, 1, 7)`)
      ).map((m) => m.month);

      expect(months.length).toBeGreaterThan(0);

      // 月が連続しているか確認
      for (let i = 1; i < months.length; i++) {
        const prev = new Date(`${months[i - 1]}-01`);
        const curr = new Date(`${months[i]}-01`);

        // 次の月か確認
        prev.setMonth(prev.getMonth() + 1);
        expect(prev.toISOString().slice(0, 7)).toBe(curr.toISOString().slice(0, 7));
      }
    });
  });

  describe("予算設定", () => {
    test("生活グループとグループ選択なしに予算が設定されている", async () => {
      const groups = await db
        .select()
        .from(schema.groups)
        .where(sql`${schema.groups.name} IN ('グループ選択なし', '生活')`);

      for (const group of groups) {
        const targets = await db
          .select()
          .from(schema.spendingTargets)
          .where(eq(schema.spendingTargets.groupId, group.id));

        expect(targets.length).toBeGreaterThan(0);
      }
    });

    test("投資グループには予算が設定されていない", async () => {
      const investmentGroup = (
        await db.select().from(schema.groups).where(eq(schema.groups.name, "投資"))
      )[0];

      expect(investmentGroup).toBeDefined();

      const targets = await db
        .select()
        .from(schema.spendingTargets)
        .where(eq(schema.spendingTargets.groupId, investmentGroup!.id));

      expect(targets).toHaveLength(0);
    });
  });
});
