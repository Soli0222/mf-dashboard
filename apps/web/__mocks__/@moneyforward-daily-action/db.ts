// Storybook mock for @moneyforward-daily-action/db
// Prevents native addon from being loaded in the browser
import { fn } from "storybook/test";

// Core exports
export const getDb = fn();
export const closeDb = fn(async () => {});
export const initDb = fn(async () => {});
export const isDatabaseAvailable = fn(() => true);
export const schema = {};

// Shared utilities - group-filter
export const getDefaultGroupId = fn(async () => null);
export const resolveGroupId = fn();
export const getAccountIdsForGroup = fn(async () => []);

// Shared utilities - transfer
export const transformTransferToIncome = fn((tx: unknown) => tx);

// Shared utilities - utils
export const generateMonthRange = fn(() => []);

// Query modules - groups
export const getCurrentGroup = fn(async () => null);
export const getAllGroups = fn(async () => []);

// Query modules - transaction
export const getTransactions = fn(async () => []);
export const getTransactionsByMonth = fn(async () => []);
export const getTransactionsByAccountId = fn(async () => []);

// Query modules - summary
export const buildIncludedTransactionCondition = fn();
export const buildOutsideTransferCondition = fn();
export const buildGroupTransactionCondition = fn();
export const buildRegularIncomeSum = fn();
export const getDeduplicatedTransferIncome = fn(async () => 0);
export const buildExpenseSum = fn();
export const getLatestMonthlySummary = fn(async () => null);
export const getMonthlySummaries = fn(async () => []);
export const getAvailableMonths = fn(async () => []);
export const getMonthlySummaryByMonth = fn(async () => null);
export const getMonthlyCategoryTotals = fn(async () => []);
export const getYearToDateSummary = fn(async () => null);
export const getExpenseByFixedVariable = fn(async () => ({ fixed: [], variable: [] }));

// Query modules - account
export const getLatestUpdateDate = fn(async () => null);
export const normalizeAccount = fn((a: unknown) => a);
export const buildActiveAccountCondition = fn();
export const getAccountsWithAssets = fn(async () => []);
export const getAllAccountMfIds = fn(async () => []);
export const getAccountByMfId = fn(async () => null);
export const groupAccountsByCategory = fn(() => []);
export const getAccountsGroupedByCategory = fn(async () => []);

// Query modules - asset
export const parseDateString = fn();
export const toDateString = fn();
export const calculateTargetDate = fn();
export const getAssetBreakdownByCategory = fn(async () => []);
export const aggregateLiabilitiesByCategory = fn(() => []);
export const getLiabilityBreakdownByCategory = fn(async () => []);
export const getAssetHistory = fn(async () => []);
export const getAssetHistoryWithCategories = fn(async () => []);
export const getLatestTotalAssets = fn(async () => null);
export const getDailyAssetChange = fn(async () => null);
export const calculateCategoryChanges = fn(() => []);
export const getCategoryChangesForPeriod = fn(async () => null);

// Query modules - holding
export const getLatestSnapshot = fn(async () => undefined);
export const buildHoldingWhereCondition = fn();
export const getHoldingsWithLatestValues = fn(async () => []);
export const getHoldingsByAccountId = fn(async () => []);
export const getHoldingsWithDailyChange = fn(async () => []);
export const hasInvestmentHoldings = fn(async () => false);
