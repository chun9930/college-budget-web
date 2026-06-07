import {
  LEGACY_SEED_EMAILS,
  buildSeedAccountData,
  buildSeedUsers,
  getPrimarySeedAccount,
} from './seedData';

export const KEYS = {
  monthlyIncome: 'monthlyIncome',
  budgetSettings: 'budgetSettings',
  budgetsByMonth: 'budgetsByMonth',
  savingGoalSettings: 'savingGoalSettings',
  savingGoals: 'savingGoals',
  alertState: 'alertState',
  alertHistory: 'alertHistory',
  expenseRecords: 'expenseRecords',
  recurringExpenses: 'recurringExpenses',
  carryOverState: 'carryOverState',
  loginState: 'loginState',
  userProfile: 'userProfile',
  users: 'users',
  mockAccountData: 'mockAccountData',
};

const ALL_KEYS = Object.values(KEYS);
const SERVICE_KEYS = [
  KEYS.monthlyIncome,
  KEYS.budgetSettings,
  KEYS.budgetsByMonth,
  KEYS.savingGoalSettings,
  KEYS.savingGoals,
  KEYS.alertState,
  KEYS.alertHistory,
  KEYS.expenseRecords,
  KEYS.recurringExpenses,
  KEYS.carryOverState,
];

const DEFAULT_BUDGET_SETTINGS = {
  incomeMode: 'direct',
  hourlyWage: '',
  workHoursPerDay: '',
  workDaysPerWeek: '',
  useManualBudget: false,
  manualDailyBudget: '',
  fixedExpenseAmount: '',
  autoIncludeRecurringExpenses: false,
  emergencyFundAmount: '',
  goalEnabled: true,
  periodCalculationEnabled: true,
  carryOverEnabled: true,
  carryOverAmount: '',
  manualCarryOverEnabled: false,
  manualCarryOverAmount: '',
};

const DEFAULT_SAVING_GOAL_SETTINGS = {
  goalAmount: '',
  goalPeriod: '',
  currentSaving: '',
};

const DEFAULT_CARRY_OVER_STATE = {
  lastCalculatedMonth: '',
  monthlySnapshots: {},
};

const DEFAULT_ALERT_STATE = {
  dismissed: false,
  lastState: 'safe',
};

function createEmptyAccountSnapshotValue() {
  return {
    monthlyIncome: 0,
    budgetSettings: { ...DEFAULT_BUDGET_SETTINGS },
    budgetsByMonth: {},
    savingGoalSettings: { ...DEFAULT_SAVING_GOAL_SETTINGS },
    savingGoals: [],
    expenseRecords: [],
    recurringExpenses: [],
    alertState: { ...DEFAULT_ALERT_STATE },
    alertHistory: [],
    carryOverState: { ...DEFAULT_CARRY_OVER_STATE },
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function toString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value, fallback = false) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }

    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return Boolean(value);
}

function toObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function createFallbackId(prefix, index) {
  return `${prefix}-${index}`;
}

function getMonthKeyFromDate(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

function hasMeaningfulLegacyBudget(source) {
  const budgetSettings = normalizeStoredBudgetSettings(source?.budgetSettings);
  const savingGoalSettings = normalizeSavingGoalSettings(source?.savingGoalSettings);

  const hasBudgetDifference = Object.entries(DEFAULT_BUDGET_SETTINGS).some(
    ([key, defaultValue]) => String(budgetSettings[key]) !== String(defaultValue)
  );
  const hasSavingGoalDifference = Object.entries(DEFAULT_SAVING_GOAL_SETTINGS).some(
    ([key, defaultValue]) => String(savingGoalSettings[key]) !== String(defaultValue)
  );

  return toNumber(source?.monthlyIncome) > 0 || hasBudgetDifference || hasSavingGoalDifference;
}

function createMonthlyBudgetSnapshotValue() {
  return {
    monthlyIncome: 0,
    budgetSettings: { ...DEFAULT_BUDGET_SETTINGS },
    savingGoalSettings: { ...DEFAULT_SAVING_GOAL_SETTINGS },
    fixedExpenses: '0',
    savingGoal: '0',
    emergencyFund: '0',
    createdAt: '',
    updatedAt: '',
  };
}

function normalizeStoredMonthlyBudget(value, fallbackCreatedAt = '') {
  const source = toObject(value);
  const budgetSettings = normalizeStoredBudgetSettings(source.budgetSettings);
  const savingGoalSettings = normalizeSavingGoalSettings(source.savingGoalSettings);
  const createdAt = toString(source.createdAt || fallbackCreatedAt || '');
  const updatedAt = toString(source.updatedAt || createdAt || fallbackCreatedAt || '');

  return {
    ...createMonthlyBudgetSnapshotValue(),
    ...source,
    monthlyIncome: toNumber(source.monthlyIncome),
    budgetSettings,
    savingGoalSettings,
    fixedExpenses: toString(source.fixedExpenses ?? budgetSettings.fixedExpenseAmount ?? '0'),
    savingGoal: toString(source.savingGoal ?? savingGoalSettings.goalAmount ?? '0'),
    emergencyFund: toString(source.emergencyFund ?? budgetSettings.emergencyFundAmount ?? '0'),
    createdAt,
    updatedAt,
  };
}

function normalizeStoredBudgetsByMonth(value) {
  const source = toObject(value);

  return Object.entries(source).reduce((accumulator, [monthKey, monthValue]) => {
    const normalizedMonthKey = String(monthKey || '').trim();

    if (!normalizedMonthKey) {
      return accumulator;
    }

    accumulator[normalizedMonthKey] = normalizeStoredMonthlyBudget(monthValue);
    return accumulator;
  }, {});
}

function normalizePaymentMethod(value) {
  const text = toString(value).trim();

  if (!text) {
    return '카드';
  }

  const aliases = {
    '移대뱶': '카드',
    '移대뱁': '카드',
    '?꾧툑': '현금',
    '?댁껜': '이체',
    '怨꾩쥖?댁껜': '이체',
    '燁삳?諭?': '카드',
  };

  if (aliases[text]) {
    return aliases[text];
  }

  if (text === '카드' || text === '현금' || text === '이체' || text === '계좌이체') {
    return text;
  }

  return text;
}

function normalizeExpenseType(value) {
  const text = toString(value).trim();

  if (!text) {
    return '일반';
  }

  const aliases = {
    '?쇰컲': '일반',
    '??곗뺘': '일반',
    '?뺢린吏異?': '정기지출',
  };

  if (aliases[text]) {
    return aliases[text];
  }

  if (text === '일반' || text === '정기지출') {
    return text;
  }

  return text;
}

export function normalizeStoredBudgetSettings(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_BUDGET_SETTINGS,
    ...source,
    incomeMode: toString(source.incomeMode || DEFAULT_BUDGET_SETTINGS.incomeMode, 'direct') || 'direct',
    hourlyWage: toString(source.hourlyWage ?? DEFAULT_BUDGET_SETTINGS.hourlyWage),
    workHoursPerDay: toString(source.workHoursPerDay ?? DEFAULT_BUDGET_SETTINGS.workHoursPerDay),
    workDaysPerWeek: toString(source.workDaysPerWeek ?? DEFAULT_BUDGET_SETTINGS.workDaysPerWeek),
    useManualBudget: toBoolean(source.useManualBudget, DEFAULT_BUDGET_SETTINGS.useManualBudget),
    manualDailyBudget: toString(source.manualDailyBudget ?? DEFAULT_BUDGET_SETTINGS.manualDailyBudget),
    fixedExpenseAmount: toString(source.fixedExpenseAmount ?? DEFAULT_BUDGET_SETTINGS.fixedExpenseAmount),
    autoIncludeRecurringExpenses: toBoolean(
      source.autoIncludeRecurringExpenses,
      DEFAULT_BUDGET_SETTINGS.autoIncludeRecurringExpenses
    ),
    emergencyFundAmount: toString(
      source.emergencyFundAmount ?? DEFAULT_BUDGET_SETTINGS.emergencyFundAmount
    ),
    goalEnabled: toBoolean(source.goalEnabled, DEFAULT_BUDGET_SETTINGS.goalEnabled),
    periodCalculationEnabled: toBoolean(
      source.periodCalculationEnabled,
      DEFAULT_BUDGET_SETTINGS.periodCalculationEnabled
    ),
    carryOverEnabled: toBoolean(source.carryOverEnabled, DEFAULT_BUDGET_SETTINGS.carryOverEnabled),
    carryOverAmount: toString(source.carryOverAmount ?? DEFAULT_BUDGET_SETTINGS.carryOverAmount),
    manualCarryOverEnabled: toBoolean(
      source.manualCarryOverEnabled,
      DEFAULT_BUDGET_SETTINGS.manualCarryOverEnabled
    ),
    manualCarryOverAmount: toString(
      source.manualCarryOverAmount ?? DEFAULT_BUDGET_SETTINGS.manualCarryOverAmount
    ),
  };
}

function normalizeSavingGoalSettings(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_SAVING_GOAL_SETTINGS,
    goalAmount: toString(source.goalAmount ?? DEFAULT_SAVING_GOAL_SETTINGS.goalAmount),
    goalPeriod: toString(source.goalPeriod ?? DEFAULT_SAVING_GOAL_SETTINGS.goalPeriod),
    currentSaving: toString(source.currentSaving ?? DEFAULT_SAVING_GOAL_SETTINGS.currentSaving),
  };
}

export function normalizeStoredCarryOverState(value) {
  const source = toObject(value);
  const monthlySnapshots = toObject(source.monthlySnapshots);

  return {
    lastCalculatedMonth: toString(
      source.lastCalculatedMonth ?? DEFAULT_CARRY_OVER_STATE.lastCalculatedMonth
    ),
    monthlySnapshots: { ...monthlySnapshots },
  };
}

function normalizeAlertState(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_ALERT_STATE,
    ...source,
    dismissed: toBoolean(source.dismissed, DEFAULT_ALERT_STATE.dismissed),
    lastState: toString(source.lastState ?? DEFAULT_ALERT_STATE.lastState, 'safe') || 'safe',
  };
}

function normalizeSavingGoals(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((goal, index) => {
    const source = toObject(goal);

    return {
      id: toString(source.id || createFallbackId('saving-goal', index)),
      name: toString(source.name),
      category: toString(source.category),
      targetAmount: toString(source.targetAmount),
      currentAmount: toString(source.currentAmount),
      deadline: toString(source.deadline),
    };
  });
}

function normalizeExpenseRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((record, index) => {
    const source = toObject(record);
    const nextRecord = {
      id: toString(source.id || createFallbackId('expense-record', index)),
      date: toString(source.date),
      amount: toString(source.amount),
      category: toString(source.category),
      paymentMethod: normalizePaymentMethod(source.paymentMethod),
      type: normalizeExpenseType(source.type),
      memo: toString(source.memo),
    };

    if (source.sourceRecurringId) {
      nextRecord.sourceRecurringId = toString(source.sourceRecurringId);
    }

    if (source.monthKey) {
      nextRecord.monthKey = toString(source.monthKey);
    }

    return nextRecord;
  });
}

function normalizeRecurringExpenses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((record, index) => {
    const source = toObject(record);

    return {
      id: toString(source.id || createFallbackId('recurring-expense', index)),
      name: toString(source.name),
      amount: toString(source.amount),
      paymentDay: toString(source.paymentDay),
      category: toString(source.category),
      paymentMethod: normalizePaymentMethod(source.paymentMethod),
      memo: toString(source.memo),
    };
  });
}

function normalizeAlertHistoryItem(item, index) {
  const source = toObject(item);

  return {
    id: toString(source.id || createFallbackId('alert-history', index)),
    statusKey: toString(source.statusKey || 'safe', 'safe') || 'safe',
    statusLabel: toString(source.statusLabel || '안전'),
    message: toString(source.message),
    relatedAmount: toNumber(source.relatedAmount),
    createdAt: toString(source.createdAt || new Date().toISOString()),
    read: toBoolean(source.read, false),
  };
}

export function normalizeNotificationHistory(alertHistoryValue, notificationHistoryValue) {
  const merged = [];
  const seen = new Set();
  const sources = [alertHistoryValue, notificationHistoryValue];

  sources.forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item, index) => {
      const normalized = normalizeAlertHistoryItem(item, index);
      const signature =
        normalized.id ||
        [
          normalized.statusKey,
          normalized.message,
          normalized.relatedAmount,
          normalized.createdAt,
        ].join('|');

      if (seen.has(signature)) {
        return;
      }

      seen.add(signature);
      merged.push(normalized);
    });
  });

  return merged;
}

const DAILY_BUDGET_STATUS_KEYS = new Set(['safe', 'caution', 'danger', 'over']);
const DAILY_BUDGET_STATUS_LABELS = {
  safe: '안전',
  caution: '주의',
  danger: '위험',
  over: '초과',
};

function normalizeAlertDateKey(value, fallbackCreatedAt = '') {
  const rawValue = toString(value).trim();
  if (rawValue) {
    return rawValue.slice(0, 10);
  }

  const fallback = toString(fallbackCreatedAt).trim();
  if (!fallback) {
    return '';
  }

  const parsed = new Date(fallback);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function normalizeDailyBudgetStatusAlertItem(item, index) {
  const source = toObject(item);
  const statusKey = toString(source.statusKey || 'safe', 'safe') || 'safe';
  const createdAt = toString(source.createdAt || new Date().toISOString());
  const alertType = toString(source.alertType).trim() || (DAILY_BUDGET_STATUS_KEYS.has(statusKey) ? 'daily-budget-status' : '');
  const dateKey = normalizeAlertDateKey(source.dateKey, createdAt);

  return {
    id: toString(source.id || createFallbackId('alert-history', index)),
    alertType,
    dateKey: alertType === 'daily-budget-status' ? dateKey : dateKey,
    statusKey,
    statusLabel: toString(source.statusLabel || DAILY_BUDGET_STATUS_LABELS[statusKey] || '안전'),
    message: toString(source.message),
    relatedAmount: toNumber(source.relatedAmount),
    createdAt,
    read: toBoolean(source.read, false),
  };
}

export function normalizeDailyBudgetStatusAlertHistory(alertHistoryValue, notificationHistoryValue) {
  const merged = [];
  const seen = new Set();
  const dailyBudgetStatusIndexByDate = new Map();
  const sources = [alertHistoryValue, notificationHistoryValue];

  sources.forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item, index) => {
      const normalized = normalizeDailyBudgetStatusAlertItem(item, index);
      if (normalized.alertType === 'daily-budget-status') {
        const signature = `${normalized.alertType}|${normalized.dateKey}`;
        const existingIndex = dailyBudgetStatusIndexByDate.get(signature);

        if (existingIndex === undefined) {
          dailyBudgetStatusIndexByDate.set(signature, merged.length);
          merged.push(normalized);
          return;
        }

        const existing = merged[existingIndex];
        const nextTime = Date.parse(normalized.createdAt || '');
        const existingTime = Date.parse(existing.createdAt || '');
        if (!Number.isFinite(existingTime) || Number.isFinite(nextTime) && nextTime >= existingTime) {
          merged[existingIndex] = normalized;
        }
        return;
      }

      const signature =
        normalized.id ||
        [
          normalized.alertType,
          normalized.dateKey,
          normalized.statusKey,
          normalized.message,
          normalized.relatedAmount,
          normalized.createdAt,
        ].join('|');

      if (seen.has(signature)) {
        return;
      }

      seen.add(signature);
      merged.push(normalized);
    });
  });

  return merged;
}

export function upsertDailyBudgetStatusAlertHistory(currentHistory = [], nextAlert = {}) {
  const normalizedNext = normalizeDailyBudgetStatusAlertItem(
    {
      ...nextAlert,
      alertType: nextAlert.alertType || 'daily-budget-status',
    },
    0
  );

  const current = Array.isArray(currentHistory)
    ? currentHistory.map((item, index) => normalizeDailyBudgetStatusAlertItem(item, index))
    : [];

  if (normalizedNext.alertType !== 'daily-budget-status' || !normalizedNext.dateKey) {
    return [normalizedNext, ...current].slice(0, 20);
  }

  const matchingItems = current.filter(
    (item) => item.alertType === 'daily-budget-status' && item.dateKey === normalizedNext.dateKey
  );

  if (
    matchingItems.length === 1 &&
    matchingItems[0].statusKey === normalizedNext.statusKey &&
    matchingItems[0].statusLabel === normalizedNext.statusLabel &&
    matchingItems[0].message === normalizedNext.message &&
    Number(matchingItems[0].relatedAmount || 0) === Number(normalizedNext.relatedAmount || 0)
  ) {
    return currentHistory;
  }

  const remaining = current.filter(
    (item) => !(item.alertType === 'daily-budget-status' && item.dateKey === normalizedNext.dateKey)
  );
  const existing = matchingItems[0];

  return [
    {
      ...(existing || normalizedNext),
      ...normalizedNext,
      id: existing?.id || normalizedNext.id,
      read: false,
    },
    ...remaining,
  ].slice(0, 20);
}

export function normalizeStoredAccountSnapshot(snapshot) {
  const source = toObject(snapshot);
  const { notificationHistory, ...rest } = source;
  const normalizedBudgetsByMonth = normalizeStoredBudgetsByMonth(rest.budgetsByMonth);
  const legacyBudgetSettings = normalizeStoredBudgetSettings(rest.budgetSettings);
  const legacySavingGoalSettings = normalizeSavingGoalSettings(rest.savingGoalSettings);
  const currentMonthKey = getMonthKeyFromDate(new Date());
  const budgetsByMonth = { ...normalizedBudgetsByMonth };

  if (Object.keys(budgetsByMonth).length === 0 && hasMeaningfulLegacyBudget(rest)) {
    budgetsByMonth[currentMonthKey] = normalizeStoredMonthlyBudget(
      {
        monthlyIncome: rest.monthlyIncome,
        budgetSettings: legacyBudgetSettings,
        savingGoalSettings: legacySavingGoalSettings,
        fixedExpenses: legacyBudgetSettings.fixedExpenseAmount,
        savingGoal: legacySavingGoalSettings.goalAmount,
        emergencyFund: legacyBudgetSettings.emergencyFundAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      new Date().toISOString()
    );
  }

  const currentMonthBudget = budgetsByMonth[currentMonthKey] || null;

  return {
    monthlyIncome: currentMonthBudget ? currentMonthBudget.monthlyIncome : toNumber(rest.monthlyIncome),
    budgetSettings: currentMonthBudget ? currentMonthBudget.budgetSettings : legacyBudgetSettings,
    budgetsByMonth,
    savingGoalSettings: currentMonthBudget
      ? currentMonthBudget.savingGoalSettings
      : legacySavingGoalSettings,
    savingGoals: normalizeSavingGoals(rest.savingGoals),
    expenseRecords: normalizeExpenseRecords(rest.expenseRecords),
    recurringExpenses: normalizeRecurringExpenses(rest.recurringExpenses),
    alertState: normalizeAlertState(rest.alertState),
    alertHistory: normalizeDailyBudgetStatusAlertHistory(rest.alertHistory, notificationHistory),
    carryOverState: normalizeStoredCarryOverState(rest.carryOverState),
  };
}

export function createEmptyAccountSnapshot() {
  return normalizeStoredAccountSnapshot(createEmptyAccountSnapshotValue());
}

function mergeSeedUsers(existingUsers) {
  const legacySeedEmails = new Set(
    LEGACY_SEED_EMAILS.map((email) => normalizeEmail(email)).filter(Boolean)
  );
  const users = Array.isArray(existingUsers)
    ? existingUsers
        .map((user) => ({
          name: String(user?.name || '').trim(),
          email: normalizeEmail(user?.email),
          password: String(user?.password || ''),
        }))
        .filter((user) => !legacySeedEmails.has(user.email))
    : [];
  const nextUsers = new Map(users.filter((user) => user.email).map((user) => [user.email, user]));

  buildSeedUsers().forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email);
    if (!normalizedEmail) {
      return;
    }

    nextUsers.set(normalizedEmail, {
      name: String(user.name || '').trim(),
      email: normalizedEmail,
      password: String(user.password || ''),
    });
  });

  return Array.from(nextUsers.values());
}

function mergeSeedAccountData(existingAccountData) {
  const nextAccountData =
    existingAccountData && typeof existingAccountData === 'object' ? { ...existingAccountData } : {};
  const seedAccountData = buildSeedAccountData();
  const legacySeedEmails = new Set(
    LEGACY_SEED_EMAILS.map((email) => normalizeEmail(email)).filter(Boolean)
  );

  Object.keys(nextAccountData).forEach((email) => {
    if (legacySeedEmails.has(normalizeEmail(email))) {
      delete nextAccountData[normalizeEmail(email)];
    }
  });

  Object.entries(seedAccountData).forEach(([email, snapshot]) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return;
    }

    nextAccountData[normalizedEmail] = normalizeStoredAccountSnapshot(snapshot);
  });

  return nextAccountData;
}

function getSeedAccountSnapshot(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const seedAccountData = buildSeedAccountData();
  const snapshot = seedAccountData[normalizedEmail];
  return snapshot ? normalizeStoredAccountSnapshot(snapshot) : null;
}

export function loadNormalizedServiceState(email) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const accountSnapshot = loadAccountSnapshot(normalizedEmail);
    if (accountSnapshot) {
      return accountSnapshot;
    }

    const seedSnapshot = getSeedAccountSnapshot(normalizedEmail);
    if (seedSnapshot) {
      return seedSnapshot;
    }

    return normalizeStoredAccountSnapshot({
      monthlyIncome: loadJSON(KEYS.monthlyIncome, 0),
      budgetSettings: loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS),
      budgetsByMonth: loadJSON(KEYS.budgetsByMonth, {}),
      savingGoalSettings: loadJSON(KEYS.savingGoalSettings, DEFAULT_SAVING_GOAL_SETTINGS),
      savingGoals: loadJSON(KEYS.savingGoals, []),
      expenseRecords: loadJSON(KEYS.expenseRecords, []),
      recurringExpenses: loadJSON(KEYS.recurringExpenses, []),
      alertState: loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE),
      alertHistory: normalizeDailyBudgetStatusAlertHistory(
        loadJSON(KEYS.alertHistory, []),
        loadJSON('notificationHistory', [])
      ),
      carryOverState: loadJSON(KEYS.carryOverState, DEFAULT_CARRY_OVER_STATE),
    });
  }

  return normalizeStoredAccountSnapshot({
    monthlyIncome: loadJSON(KEYS.monthlyIncome, 0),
    budgetSettings: loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS),
    budgetsByMonth: loadJSON(KEYS.budgetsByMonth, {}),
    savingGoalSettings: loadJSON(KEYS.savingGoalSettings, DEFAULT_SAVING_GOAL_SETTINGS),
    savingGoals: loadJSON(KEYS.savingGoals, []),
    expenseRecords: loadJSON(KEYS.expenseRecords, []),
    recurringExpenses: loadJSON(KEYS.recurringExpenses, []),
    alertState: loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE),
    alertHistory: normalizeDailyBudgetStatusAlertHistory(
      loadJSON(KEYS.alertHistory, []),
      loadJSON('notificationHistory', [])
    ),
    carryOverState: loadJSON(KEYS.carryOverState, DEFAULT_CARRY_OVER_STATE),
  });
}

export function loadJSON(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  const rawValue = window.localStorage.getItem(key);
  if (rawValue === null) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

export function saveJSON(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeJSON(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

export function clearAllStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  ALL_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function loadAccountSnapshot(email) {
  const accountData = loadJSON(KEYS.mockAccountData, {});
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !accountData || typeof accountData !== 'object') {
    return null;
  }

  const snapshot = accountData[normalizedEmail];
  return snapshot ? normalizeStoredAccountSnapshot(snapshot) : null;
}

export const getAccountSnapshot = loadAccountSnapshot;

export function saveAccountSnapshot(email, snapshot) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const accountData = loadJSON(KEYS.mockAccountData, {});
  const nextAccountData = accountData && typeof accountData === 'object' ? { ...accountData } : {};

  if (snapshot === null || snapshot === undefined) {
    delete nextAccountData[normalizedEmail];
  } else {
    nextAccountData[normalizedEmail] = normalizeStoredAccountSnapshot(snapshot);
  }

  saveJSON(KEYS.mockAccountData, nextAccountData);
}

export function seedMockDataIfNeeded() {
  if (typeof window === 'undefined') {
    return false;
  }

  const primaryAccount = getPrimarySeedAccount();
  let didSeedAnything = false;
  const existingUsers = loadJSON(KEYS.users, []);
  const nextUsers = mergeSeedUsers(existingUsers);
  const usersChanged = JSON.stringify(nextUsers) !== JSON.stringify(existingUsers);

  if (usersChanged || window.localStorage.getItem(KEYS.users) === null) {
    saveJSON(KEYS.users, nextUsers);
    didSeedAnything = true;
  }

  const existingAccountData = loadJSON(KEYS.mockAccountData, {});
  const nextAccountData = mergeSeedAccountData(existingAccountData);
  const accountDataChanged =
    JSON.stringify(nextAccountData) !== JSON.stringify(existingAccountData);

  if (accountDataChanged || window.localStorage.getItem(KEYS.mockAccountData) === null) {
    saveJSON(KEYS.mockAccountData, nextAccountData);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.monthlyIncome) === null) {
    saveJSON(KEYS.monthlyIncome, primaryAccount.monthlyIncome);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.budgetSettings) === null) {
    saveJSON(KEYS.budgetSettings, normalizeStoredBudgetSettings(primaryAccount.budgetSettings));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.budgetsByMonth) === null) {
    saveJSON(KEYS.budgetsByMonth, normalizeStoredBudgetsByMonth(primaryAccount.budgetsByMonth));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.savingGoalSettings) === null) {
    saveJSON(
      KEYS.savingGoalSettings,
      normalizeSavingGoalSettings(primaryAccount.savingGoalSettings)
    );
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.savingGoals) === null) {
    saveJSON(KEYS.savingGoals, normalizeSavingGoals(primaryAccount.savingGoals || []));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.expenseRecords) === null) {
    saveJSON(KEYS.expenseRecords, normalizeExpenseRecords(primaryAccount.expenseRecords));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.recurringExpenses) === null) {
    saveJSON(
      KEYS.recurringExpenses,
      normalizeRecurringExpenses(primaryAccount.recurringExpenses)
    );
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.alertState) === null) {
    saveJSON(KEYS.alertState, normalizeAlertState(DEFAULT_ALERT_STATE));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.alertHistory) === null) {
    saveJSON(KEYS.alertHistory, []);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.carryOverState) === null) {
    saveJSON(KEYS.carryOverState, normalizeStoredCarryOverState(primaryAccount.carryOverState));
    didSeedAnything = true;
  }

  return didSeedAnything;
}

export function resetSeedData() {
  if (typeof window === 'undefined') {
    return false;
  }

  const seedEmails = new Set(
    [...buildSeedUsers().map((user) => normalizeEmail(user.email)), ...LEGACY_SEED_EMAILS]
      .map((email) => normalizeEmail(email))
      .filter(Boolean)
  );

  const existingUsers = loadJSON(KEYS.users, []);
  const nextUsers = Array.isArray(existingUsers)
    ? existingUsers.filter((user) => !seedEmails.has(normalizeEmail(user?.email)))
    : [];

  if (JSON.stringify(nextUsers) !== JSON.stringify(existingUsers)) {
    saveJSON(KEYS.users, nextUsers);
  }

  const existingAccountData = loadJSON(KEYS.mockAccountData, {});
  const nextAccountData =
    existingAccountData && typeof existingAccountData === 'object'
      ? Object.fromEntries(
          Object.entries(existingAccountData).filter(
            ([email]) => !seedEmails.has(normalizeEmail(email))
          )
        )
      : {};

  if (JSON.stringify(nextAccountData) !== JSON.stringify(existingAccountData)) {
    saveJSON(KEYS.mockAccountData, nextAccountData);
  }

  clearServiceStorage({ preserveAccountSnapshot: true });

  return seedMockDataIfNeeded();
}

export function clearServiceStorage(options = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const preserveAccountSnapshot = toBoolean(options.preserveAccountSnapshot, false);

  SERVICE_KEYS.forEach((key) => window.localStorage.removeItem(key));

  if (preserveAccountSnapshot) {
    return;
  }

  const loginState = loadJSON(KEYS.loginState, null);
  const userProfile = loadJSON(KEYS.userProfile, null);
  const email = normalizeEmail(userProfile?.email || loginState?.email || '');

  if (email) {
    const accountData = loadJSON(KEYS.mockAccountData, {});
    if (accountData && typeof accountData === 'object' && accountData[email]) {
      const nextAccountData = { ...accountData };
      delete nextAccountData[email];
      saveJSON(KEYS.mockAccountData, nextAccountData);
    }
  }
}
