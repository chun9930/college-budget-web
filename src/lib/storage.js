import { dummyExpenses } from '../data/dummyExpenses.js';
import { dummyExpenseTemplates } from '../data/dummyExpenseTemplates.js';
import { STORAGE_KEYS } from './storageKeys.js';

function readValue(key, defaultValue) {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;

  if (!storage) {
    return defaultValue;
  }

  const storedValue = storage.getItem(key);

  if (storedValue === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return defaultValue;
  }
}

function writeValue(key, value) {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function sanitizeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
}

function sanitizeBudgetSettings(budgetSettings) {
  return {
    manualDailyBudget: sanitizeNumber(budgetSettings?.manualDailyBudget),
    carryOverEnabled: Boolean(budgetSettings?.carryOverEnabled),
    savingGoalAmount: sanitizeNumber(budgetSettings?.savingGoalAmount),
    emergencyFundAmount: sanitizeNumber(budgetSettings?.emergencyFundAmount),
  };
}

function sanitizeBudgetAlertState(budgetAlertState) {
  return {
    dismissedDailySignature:
      typeof budgetAlertState?.dismissedDailySignature === 'string'
        ? budgetAlertState.dismissedDailySignature
        : '',
    dismissedMonthlySignature:
      typeof budgetAlertState?.dismissedMonthlySignature === 'string'
        ? budgetAlertState.dismissedMonthlySignature
        : '',
    dismissedAt: typeof budgetAlertState?.dismissedAt === 'string' ? budgetAlertState.dismissedAt : '',
  };
}

function normalizeExpenseRecord(expenseRecord) {
  return {
    id: expenseRecord?.id ?? Date.now(),
    amount: sanitizeNumber(expenseRecord?.amount),
    category: typeof expenseRecord?.category === 'string' ? expenseRecord.category : '기타',
    date: typeof expenseRecord?.date === 'string' ? expenseRecord.date : '',
    memo: typeof expenseRecord?.memo === 'string' ? expenseRecord.memo : '',
    paymentMethod: typeof expenseRecord?.paymentMethod === 'string' ? expenseRecord.paymentMethod : '카드',
    expenseType: typeof expenseRecord?.expenseType === 'string' ? expenseRecord.expenseType : '일반지출',
  };
}

function normalizeExpenseTemplate(expenseTemplate) {
  return {
    id: expenseTemplate?.id ?? Date.now(),
    name: typeof expenseTemplate?.name === 'string' ? expenseTemplate.name : '템플릿',
    amount: sanitizeNumber(expenseTemplate?.amount),
    category: typeof expenseTemplate?.category === 'string' ? expenseTemplate.category : '기타',
    memo: typeof expenseTemplate?.memo === 'string' ? expenseTemplate.memo : '',
    paymentMethod:
      typeof expenseTemplate?.paymentMethod === 'string' ? expenseTemplate.paymentMethod : '카드',
    expenseType:
      typeof expenseTemplate?.expenseType === 'string' ? expenseTemplate.expenseType : '일반지출',
  };
}

export function getMonthlyIncome() {
  return readValue(STORAGE_KEYS.monthlyIncome, 0);
}

export function setMonthlyIncome(monthlyIncome) {
  writeValue(STORAGE_KEYS.monthlyIncome, sanitizeNumber(monthlyIncome));
}

export function getBudgetAmount() {
  return readValue(STORAGE_KEYS.budgetAmount, 0);
}

export function setBudgetAmount(budgetAmount) {
  writeValue(STORAGE_KEYS.budgetAmount, sanitizeNumber(budgetAmount));
}

export function getBudgetSettings() {
  return readValue(STORAGE_KEYS.budgetSettings, sanitizeBudgetSettings());
}

export function setBudgetSettings(budgetSettings) {
  writeValue(STORAGE_KEYS.budgetSettings, sanitizeBudgetSettings(budgetSettings));
}

export function getBudgetAlertState() {
  return readValue(STORAGE_KEYS.budgetAlertState, sanitizeBudgetAlertState());
}

export function setBudgetAlertState(budgetAlertState) {
  writeValue(STORAGE_KEYS.budgetAlertState, sanitizeBudgetAlertState(budgetAlertState));
}

export function acknowledgeBudgetAlert(type, signature) {
  const currentState = getBudgetAlertState();
  const nextState = {
    ...currentState,
    dismissedAt: new Date().toISOString(),
  };

  if (type === 'daily') {
    nextState.dismissedDailySignature = typeof signature === 'string' ? signature : '';
  }

  if (type === 'monthly') {
    nextState.dismissedMonthlySignature = typeof signature === 'string' ? signature : '';
  }

  setBudgetAlertState(nextState);
  return nextState;
}

export function clearBudgetAlertState(type) {
  const currentState = getBudgetAlertState();

  if (type === 'daily') {
    const nextState = {
      ...currentState,
      dismissedDailySignature: '',
      dismissedAt: new Date().toISOString(),
    };

    setBudgetAlertState(nextState);
    return nextState;
  }

  if (type === 'monthly') {
    const nextState = {
      ...currentState,
      dismissedMonthlySignature: '',
      dismissedAt: new Date().toISOString(),
    };

    setBudgetAlertState(nextState);
    return nextState;
  }

  const nextState = sanitizeBudgetAlertState();
  setBudgetAlertState(nextState);
  return nextState;
}

export function getExpenseRecords() {
  return readValue(STORAGE_KEYS.expenseRecords, dummyExpenses).map(normalizeExpenseRecord);
}

export function setExpenseRecords(expenseRecords) {
  writeValue(
    STORAGE_KEYS.expenseRecords,
    Array.isArray(expenseRecords) ? expenseRecords.map(normalizeExpenseRecord) : [],
  );
}

export function addExpenseRecord(expenseRecord) {
  const currentRecords = getExpenseRecords();
  const nextRecords = [expenseRecord, ...currentRecords];
  setExpenseRecords(nextRecords);
  return nextRecords;
}

export function getExpenseTemplates() {
  return readValue(STORAGE_KEYS.expenseTemplates, dummyExpenseTemplates).map(normalizeExpenseTemplate);
}

export function setExpenseTemplates(expenseTemplates) {
  writeValue(
    STORAGE_KEYS.expenseTemplates,
    Array.isArray(expenseTemplates) ? expenseTemplates.map(normalizeExpenseTemplate) : [],
  );
}

export function addExpenseTemplate(expenseTemplate) {
  const currentTemplates = getExpenseTemplates();
  const nextTemplates = [expenseTemplate, ...currentTemplates];
  setExpenseTemplates(nextTemplates);
  return nextTemplates;
}

export function removeExpenseTemplate(templateId) {
  const currentTemplates = getExpenseTemplates();
  const nextTemplates = currentTemplates.filter((template) => template?.id !== templateId);
  setExpenseTemplates(nextTemplates);
  return nextTemplates;
}

export function getLoginState() {
  return readValue(STORAGE_KEYS.loginState, {
    isLoggedIn: false,
    displayName: '',
  });
}

export function setLoginState(loginState) {
  writeValue(STORAGE_KEYS.loginState, {
    isLoggedIn: Boolean(loginState?.isLoggedIn),
    displayName: typeof loginState?.displayName === 'string' ? loginState.displayName : '',
  });
}

export function clearLoginState() {
  writeValue(STORAGE_KEYS.loginState, {
    isLoggedIn: false,
    displayName: '',
  });
}
