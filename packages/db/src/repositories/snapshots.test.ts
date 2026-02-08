import { describe, test, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createTestDb, resetTestDb, closeTestDb } from "../test-helpers";
import { upsertGroup } from "./groups";
import { createSnapshot, hasExistingData } from "./snapshots";

type Db = Awaited<ReturnType<typeof createTestDb>>;

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await closeTestDb(db);
});

beforeEach(async () => {
  await resetTestDb(db);
});

describe("createSnapshot", () => {
  test("スナップショットを作成して ID を返す", async () => {
    await upsertGroup(db, { id: "g1", name: "test", isCurrent: true });
    const id = await createSnapshot(db, "g1", "2025-04-26");
    expect(id).toBeGreaterThan(0);
  });

  test("同じ日に複数スナップショットを作成できる", async () => {
    await upsertGroup(db, { id: "g1", name: "test", isCurrent: true });
    const id1 = await createSnapshot(db, "g1", "2025-04-26");
    const id2 = await createSnapshot(db, "g1", "2025-04-26");
    expect(id1).not.toBe(id2);
  });
});

describe("hasExistingData", () => {
  test("DBが空の場合は false を返す", async () => {
    expect(await hasExistingData(db)).toBe(false);
  });

  test("スナップショットが存在する場合は true を返す", async () => {
    await upsertGroup(db, { id: "g1", name: "test", isCurrent: true });
    await createSnapshot(db, "g1", "2025-04-26");
    expect(await hasExistingData(db)).toBe(true);
  });
});
