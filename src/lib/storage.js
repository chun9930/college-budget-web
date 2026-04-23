import { dummyExpenses } from '../data/dummyExpenses.js';
import { STORAGE_KEYS } from './storageKeys.js';

function readValue(key, defaultValue) {
  const storedValue = window.localStorage.getItem(key);

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
  window.localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
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

export function getExpenseRecords() {
  return readValue(STORAGE_KEYS.expenseRecords, dummyExpenses);
}

export function setExpenseRecords(expenseRecords) {
  writeValue(STORAGE_KEYS.expenseRecords, Array.isArray(expenseRecords) ? expenseRecords : []);
}

export function addExpenseRecord(expenseRecord) {
  const currentRecords = getExpenseRecords();
  const nextRecords = [expenseRecord, ...currentRecords];
  setExpenseRecords(nextRecords);
  return nextRecords;
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
