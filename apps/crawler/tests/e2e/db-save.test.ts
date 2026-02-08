import type { Browser, BrowserContext } from "playwright";
import { getDb, closeDb, schema } from "@moneyforward-daily-action/db";
import { saveScrapedData } from "@moneyforward-daily-action/db/repository/save-scraped-data";
import { eq } from "drizzle-orm";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { scrape } from "../../src/scraper.js";
import {
  gotoHome,
  launchLoggedInContext,
  saveScreenshot,
  setupTestDb,
  cleanupTestDb,
  withErrorScreenshot,
  withNewPage,
} from "./helpers.js";

let browser: Browser;
let context: BrowserContext;

beforeAll(async () => {
  // テスト用 DB を環境変数で設定
  await setupTestDb();

  // auth state を使ってブラウザ起動 & スクレイプ
  ({ browser, context } = await launchLoggedInContext());
  await withNewPage(context, async (page) => {
    await gotoHome(page);
    await saveScreenshot(page, "db-save-test-before-scrape.png");

    const data = await withErrorScreenshot(page, "db-save-test-error.png", () =>
      scrape(page, { skipRefresh: true }),
    );
    await saveScrapedData(getDb(), data);
  });
});

afterAll(async () => {
  await context?.close();
  await browser?.close();
  // テスト後にクリーンアップ
  await cleanupTestDb();
  await closeDb();
});

describe("DB保存", () => {
  test("グループが保存される", async () => {
    const db = getDb();
    const groups = await db.select().from(schema.groups);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.some((g) => g.isCurrent)).toBe(true);
  });

  test("口座が保存される", async () => {
    const db = getDb();
    const accounts = await db.select().from(schema.accounts);
    expect(accounts.length).toBeGreaterThan(0);
  });

  test("資産カテゴリが保存される", async () => {
    const db = getDb();
    const categories = await db.select().from(schema.assetCategories);
    expect(categories.length).toBeGreaterThan(0);
  });

  test("日次スナップショットが保存される", async () => {
    const db = getDb();
    const snapshots = await db.select().from(schema.dailySnapshots);
    expect(snapshots.length).toBeGreaterThan(0);
    const latestSnapshot = snapshots[snapshots.length - 1];
    const today = new Date().toISOString().split("T")[0];
    expect(latestSnapshot.date).toBe(today);
  });

  test("保有銘柄が保存される", async () => {
    const db = getDb();
    const holdings = await db.select().from(schema.holdings);
    expect(holdings.length).toBeGreaterThan(0);
    const assetHoldings = holdings.filter((h) => h.type === "asset");
    expect(assetHoldings.length).toBeGreaterThan(0);
  });

  test("評価額が保存される", async () => {
    const db = getDb();
    const snapshots = await db.select().from(schema.dailySnapshots);
    const latestSnapshot = snapshots[snapshots.length - 1];
    const holdingValues = await db
      .select()
      .from(schema.holdingValues)
      .where(eq(schema.holdingValues.snapshotId, latestSnapshot.id));
    expect(holdingValues.length).toBeGreaterThan(0);
  });

  test("投資銘柄の詳細値が保存される", async () => {
    const db = getDb();
    const snapshots = await db.select().from(schema.dailySnapshots);
    const latestSnapshot = snapshots[snapshots.length - 1];
    // 投資信託か株式のholding valuesを取得
    const holdingValues = await db
      .select()
      .from(schema.holdingValues)
      .innerJoin(schema.holdings, eq(schema.holdings.id, schema.holdingValues.holdingId))
      .innerJoin(schema.assetCategories, eq(schema.assetCategories.id, schema.holdings.categoryId))
      .where(eq(schema.holdingValues.snapshotId, latestSnapshot.id));

    // 投資信託か株式のレコードを探す
    const investmentHoldings = holdingValues.filter(
      (hv) => hv.asset_categories.name === "投資信託" || hv.asset_categories.name === "株式(現物)",
    );

    if (investmentHoldings.length > 0) {
      const sample = investmentHoldings[0].holding_values;
      // 数量が保存されている
      expect(sample.quantity).not.toBeNull();
      // 単価が保存されている
      expect(sample.unitPrice).not.toBeNull();
      // 前日比は0も有効な値なのでnullでないことのみ確認
      expect(sample.dailyChange).not.toBeNull();
      // 評価損益が保存されている
      expect(sample.unrealizedGain).not.toBeNull();
    }
  });

  test("口座ステータスが保存される", async () => {
    const db = getDb();
    const accountStatuses = await db.select().from(schema.accountStatuses);
    expect(accountStatuses.length).toBeGreaterThan(0);
  });

  // Note: monthly_summary, yearly_summary, and monthly_category_totals are now calculated dynamically from transactions

  test("トランザクションが保存される", async () => {
    const db = getDb();
    const transactions = await db.select().from(schema.transactions);
    expect(transactions.length).toBeGreaterThan(0);
    // mfId がユニーク
    const mfIds = transactions.map((t) => t.mfId);
    expect(new Set(mfIds).size).toBe(transactions.length);
  });
});
