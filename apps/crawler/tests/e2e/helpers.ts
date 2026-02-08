import type { Browser, BrowserContext, Page } from "playwright";
import { initDb, closeDb, getDb, schema } from "@moneyforward-daily-action/db";
import { mfUrls } from "@moneyforward-daily-action/meta/urls";
import { sql } from "drizzle-orm";
import path from "node:path";
import { chromium } from "playwright";
import { createBrowserContext } from "../../src/browser/context.js";
import { SCREENSHOT_DIR, ensureScreenshotDir } from "./global-setup.js";

const NAVIGATION_TIMEOUT = 30000;
const TEST_DATABASE_URL = "postgresql://mf:mf@localhost:5432/mf_dashboard_test";

export async function launchLoggedInContext(): Promise<{
  browser: Browser;
  context: BrowserContext;
}> {
  const browser = await chromium.launch({ headless: true });
  const context = await createBrowserContext(browser, { useAuthState: true });
  return { browser, context };
}

export async function gotoHome(page: Page): Promise<void> {
  await page.goto(mfUrls.home, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT,
  });
}

export async function saveScreenshot(page: Page, filename: string): Promise<void> {
  ensureScreenshotDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
}

export async function withErrorScreenshot<T>(
  page: Page,
  filename: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await saveScreenshot(page, filename);
    throw err;
  }
}

export async function withNewPage<T>(
  context: BrowserContext,
  fn: (page: Page) => Promise<T>,
): Promise<T> {
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

export async function setupTestDb(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  await initDb();
  await cleanupTestDb();
}

export async function cleanupTestDb(): Promise<void> {
  const db = getDb();
  // Truncate all tables in reverse dependency order
  await db.execute(sql`TRUNCATE TABLE
    holding_values,
    holdings,
    daily_snapshots,
    account_statuses,
    transactions,
    spending_targets,
    asset_history,
    group_accounts,
    accounts,
    asset_categories,
    groups
    CASCADE`);
}
