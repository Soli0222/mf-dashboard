import type { Db } from "../index";
import type { RefreshResult } from "../types";
import { schema } from "../index";
import { now } from "../utils";

/**
 * データベースにスナップショットが存在するかチェック。
 * DBが空（初回実行）の場合は false を返す。
 */
export async function hasExistingData(db: Db): Promise<boolean> {
  const result = await db
    .select({ id: schema.dailySnapshots.id })
    .from(schema.dailySnapshots)
    .limit(1);
  return result.length > 0;
}

// 実行ごとに新しいスナップショットを作成（同じ日でも複数作成可能）
export async function createSnapshot(
  db: Db,
  groupId: string,
  date: string,
  refreshResult?: RefreshResult | null,
): Promise<number> {
  const result = await db
    .insert(schema.dailySnapshots)
    .values({
      groupId,
      date,
      refreshCompleted: refreshResult?.completed ?? true,
      createdAt: now(),
      updatedAt: now(),
    })
    .returning({ id: schema.dailySnapshots.id });

  return result[0].id;
}
