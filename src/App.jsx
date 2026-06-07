import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Toast from './components/Toast';
import BudgetSettings from './pages/BudgetSettings';
import Calendar from './pages/Calendar';
import ExpenseRecords from './pages/ExpenseRecords';
import Home from './pages/Home';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Signup from './pages/Signup';
import Statistics from './pages/Statistics';
import { getAlertState, getHomeJudgmentSnapshot, getMonthlyJudgmentSnapshot } from './lib/alert';
import {
  calculateDailyBudget,
  calculateDateScopedDailyBudget,
  calculateGoalSavingPlan,
  calculateMonthlyBudgetBase,
  getToday,
  getPreviousMonthKey,
  getRemainingDaysIncludingToday,
} from './lib/budget';
import { login, logout, signup } from './lib/auth';
import { applyRecurringExpenses } from './lib/recurring';
import {
  KEYS,
  clearServiceStorage,
  loadJSON,
  loadNormalizedServiceState,
  normalizeStoredBudgetSettings,
  upsertDailyBudgetStatusAlertHistory,
  saveAccountSnapshot,
  saveJSON,
  seedMockDataIfNeeded,
} from './lib/storage';

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

const DEFAULT_SAVING_GOALS = [];

const DEFAULT_ALERT_STATE = {
  dismissed: false,
  lastState: 'safe',
};

const DEFAULT_CARRY_OVER_STATE = {
  lastCalculatedMonth: '',
  monthlySnapshots: {},
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isSamePreviousMonth(left, right) {
  const previousMonth = new Date(right.getFullYear(), right.getMonth() - 1, 1);
  return (
    left.getFullYear() === previousMonth.getFullYear() &&
    left.getMonth() === previousMonth.getMonth()
  );
}

function getMonthKey(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

function getDateKeyFromValue(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return getDateKey(parsed);
}

function getMonthKeyFromValue(value) {
  const dateKey = getDateKeyFromValue(value);
  return dateKey ? dateKey.slice(0, 7) : '';
}

function isRecordOnOrBeforeDate(recordDate, referenceDateKey) {
  const recordDateKey = getDateKeyFromValue(recordDate);
  return Boolean(recordDateKey) && recordDateKey <= referenceDateKey;
}

function buildMonthlyBudgetSnapshot({
  monthlyIncome = 0,
  budgetSettings = DEFAULT_BUDGET_SETTINGS,
  savingGoalSettings = DEFAULT_SAVING_GOAL_SETTINGS,
  createdAt = '',
  updatedAt = '',
} = {}) {
  const normalizedBudgetSettings = {
    ...normalizeStoredBudgetSettings({
      ...DEFAULT_BUDGET_SETTINGS,
      ...budgetSettings,
    }),
  };
  const normalizedSavingGoalSettings = {
    ...DEFAULT_SAVING_GOAL_SETTINGS,
    ...savingGoalSettings,
  };

  return {
    monthlyIncome: toNumber(monthlyIncome),
    budgetSettings: normalizedBudgetSettings,
    savingGoalSettings: normalizedSavingGoalSettings,
    fixedExpenses: String(normalizedBudgetSettings.fixedExpenseAmount ?? '0'),
    savingGoal: String(normalizedSavingGoalSettings.goalAmount ?? '0'),
    emergencyFund: String(normalizedBudgetSettings.emergencyFundAmount ?? '0'),
    createdAt,
    updatedAt,
  };
}

function getMonthDateFromKey(monthKey) {
  const [yearText, monthText] = String(monthKey || '').split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function calculateCarryOverForMonth({
  monthKey,
  budgetsByMonth = {},
  carryOverState = DEFAULT_CARRY_OVER_STATE,
  expenseRecords = [],
  recurringExpenses = [],
}) {
  const monthDate = getMonthDateFromKey(monthKey);
  if (!monthDate) {
    return 0;
  }

  const previousMonthKey = getPreviousMonthKey(monthDate);
  const previousMonthBudgetSnapshot = carryOverState?.monthlySnapshots?.[previousMonthKey];
  if (previousMonthBudgetSnapshot) {
    return Math.max(
      0,
      Number(previousMonthBudgetSnapshot.remainingAmount ?? previousMonthBudgetSnapshot.automaticCarryOverAmount ?? 0)
    );
  }

  const previousMonthBudgetEntry = budgetsByMonth?.[previousMonthKey] || null;
  if (!previousMonthBudgetEntry) {
    return 0;
  }

  const previousMonthBudgetSettings =
    previousMonthBudgetEntry.budgetSettings || DEFAULT_BUDGET_SETTINGS;
  const previousMonthSavingGoalSettings =
    previousMonthBudgetEntry.savingGoalSettings || DEFAULT_SAVING_GOAL_SETTINGS;
  const previousMonthGoalPlan = previousMonthBudgetSettings.goalEnabled
    ? calculateGoalSavingPlan(previousMonthSavingGoalSettings)
    : emptyGoalPlan();
  const previousMonthRecurringTotal = previousMonthBudgetSettings.autoIncludeRecurringExpenses
    ? recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0)
    : 0;
  const previousMonthBudgetBase = calculateMonthlyBudgetBase({
    monthlyIncome: previousMonthBudgetEntry.monthlyIncome,
    carryOver: 0,
    targetSavings: previousMonthGoalPlan.monthlyNeed,
    emergencyFund: previousMonthBudgetSettings.emergencyFundAmount,
    fixedExpenses: toNumber(previousMonthBudgetSettings.fixedExpenseAmount) + previousMonthRecurringTotal,
  });
  const previousMonthSpent = expenseRecords
    .filter((record) => getMonthKeyFromValue(record.date) === previousMonthKey)
    .filter(
      (record) =>
        !(
          previousMonthBudgetSettings.autoIncludeRecurringExpenses &&
          record.sourceRecurringId
        )
    )
    .reduce((sum, record) => sum + toNumber(record.amount), 0);

  return Math.max(0, previousMonthBudgetBase - previousMonthSpent);
}

function getDateKey(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
    current.getDate()
  ).padStart(2, '0')}`;
}

function buildDateTimeFromDateKey(dateKey) {
  return `${dateKey}T00:00:00`;
}

function createExpenseRecord(record) {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    amount: '',
    category: '식비',
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    ...record,
  };
}

function emptyGoalPlan() {
  return {
    remainingAmount: 0,
    dailyNeed: 0,
    weeklyNeed: 0,
    monthlyNeed: 0,
  };
}

function RequireAuth({ isAuthed, children }) {
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSeededRef = useRef(false);
  if (!hasSeededRef.current) {
    hasSeededRef.current = true;
    seedMockDataIfNeeded();
  }
  const initialLoginState = loadJSON(KEYS.loginState, null);
  const initialUserProfile = loadJSON(KEYS.userProfile, null);
  const initialAccountEmail =
    initialLoginState?.isLoggedIn && initialUserProfile?.email ? initialUserProfile.email : '';
  const initialAccountState = loadNormalizedServiceState(initialAccountEmail);
  const [monthlyIncome, setMonthlyIncome] = useState(() => initialAccountState.monthlyIncome);
  const [budgetSettings, setBudgetSettings] = useState(() => initialAccountState.budgetSettings);
  const [budgetsByMonth, setBudgetsByMonth] = useState(() => initialAccountState.budgetsByMonth || {});
  const [savingGoalSettings, setSavingGoalSettings] = useState(
    () => initialAccountState.savingGoalSettings
  );
  const [savingGoals, setSavingGoals] = useState(() => initialAccountState.savingGoals);
  const [expenseRecords, setExpenseRecords] = useState(() => initialAccountState.expenseRecords);
  const [recurringExpenses, setRecurringExpenses] = useState(
    () => initialAccountState.recurringExpenses
  );
  const [carryOverState, setCarryOverState] = useState(() => initialAccountState.carryOverState);
  const [currentDate, setCurrentDate] = useState(() => getToday());
  const [homeViewDate, setHomeViewDate] = useState(() => getToday());
  const [isHomeViewDateCustom, setIsHomeViewDateCustom] = useState(false);
  const [expenseDraftDateKey, setExpenseDraftDateKey] = useState(() => getDateKey(currentDate));
  const [alertStateState, setAlertStateState] = useState(() => initialAccountState.alertState);
  const [alertHistory, setAlertHistory] = useState(() => initialAccountState.alertHistory);
  const [loginState, setLoginState] = useState(() => initialLoginState);
  const [userProfile, setUserProfile] = useState(() => initialUserProfile);
  const [budgetPageMonthKey, setBudgetPageMonthKey] = useState(() => getMonthKey(getToday()));
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (hasSeededRef.current) {
      return;
    }

    hasSeededRef.current = true;
    seedMockDataIfNeeded();
  }, []);

  useEffect(() => {
    saveJSON(KEYS.monthlyIncome, monthlyIncome);
  }, [monthlyIncome]);

  useEffect(() => {
    saveJSON(KEYS.budgetSettings, budgetSettings);
  }, [budgetSettings]);

  useEffect(() => {
    saveJSON(KEYS.budgetsByMonth, budgetsByMonth);
  }, [budgetsByMonth]);

  useEffect(() => {
    saveJSON(KEYS.savingGoalSettings, savingGoalSettings);
  }, [savingGoalSettings]);

  useEffect(() => {
    saveJSON(KEYS.savingGoals, savingGoals);
  }, [savingGoals]);

  useEffect(() => {
    saveJSON(KEYS.expenseRecords, expenseRecords);
  }, [expenseRecords]);

  useEffect(() => {
    saveJSON(KEYS.recurringExpenses, recurringExpenses);
  }, [recurringExpenses]);

  useEffect(() => {
    saveJSON(KEYS.alertState, alertStateState);
  }, [alertStateState]);

  useEffect(() => {
    saveJSON(KEYS.alertHistory, alertHistory);
  }, [alertHistory]);

  useEffect(() => {
    saveJSON(KEYS.loginState, loginState);
  }, [loginState]);

  useEffect(() => {
    saveJSON(KEYS.userProfile, userProfile);
  }, [userProfile]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDate((current) => {
        const next = getToday();
        return getDateKey(current) === getDateKey(next) ? current : next;
      });
    }, 60000);

    return () => window.clearInterval(timerId);
  }, []);

  const homeRouteRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = homeRouteRef.current;
    homeRouteRef.current = location.pathname;

    if (location.pathname === '/' && previousPath !== '/') {
      const today = getToday();
      setHomeViewDate(today);
      setIsHomeViewDateCustom(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    if (!isHomeViewDateCustom && getDateKey(homeViewDate) !== getDateKey(currentDate)) {
      setHomeViewDate(currentDate);
    }
  }, [currentDate, homeViewDate, isHomeViewDateCustom, location.pathname]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    setExpenseRecords((current) => {
      const next = applyRecurringExpenses(current, recurringExpenses, currentDate);
      return next.length === current.length ? current : next;
    });
  }, [currentDate, recurringExpenses]);

  const currentUser = useMemo(() => {
    if (!loginState?.isLoggedIn || !userProfile) {
      return null;
    }

    return {
      ...userProfile,
      ...loginState,
    };
  }, [loginState, userProfile]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const snapshot = loadNormalizedServiceState(currentUser.email);

    setMonthlyIncome(snapshot.monthlyIncome);
    setBudgetSettings(snapshot.budgetSettings);
    setBudgetsByMonth(snapshot.budgetsByMonth || {});
    setSavingGoalSettings(snapshot.savingGoalSettings);
    setSavingGoals(snapshot.savingGoals ?? DEFAULT_SAVING_GOALS);
    setExpenseRecords(snapshot.expenseRecords);
    setRecurringExpenses(snapshot.recurringExpenses);
    setAlertStateState(snapshot.alertState);
    setAlertHistory(snapshot.alertHistory);
    setCarryOverState(snapshot.carryOverState ?? DEFAULT_CARRY_OVER_STATE);
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    saveAccountSnapshot(currentUser.email, {
      monthlyIncome,
      budgetSettings,
      budgetsByMonth,
      savingGoalSettings,
      savingGoals,
      expenseRecords,
      recurringExpenses,
      alertState: alertStateState,
      alertHistory,
      carryOverState,
    });
  }, [
    alertHistory,
    alertStateState,
    budgetSettings,
    currentUser?.email,
    budgetsByMonth,
    expenseRecords,
    monthlyIncome,
    recurringExpenses,
    savingGoalSettings,
    savingGoals,
    carryOverState,
  ]);

  const isAuthed = Boolean(currentUser);
  const showChrome = isAuthed && !['/login', '/signup'].includes(location.pathname);

  const remainingDays = getRemainingDaysIncludingToday(currentDate);
  const currentMonthKey = getMonthKey(currentDate);
  const currentMonthBudgetEntry = useMemo(() => {
    return budgetsByMonth?.[currentMonthKey] || null;
  }, [budgetsByMonth, currentMonthKey]);

  const homeViewMonthKey = getMonthKey(homeViewDate);
  const homeViewBudgetEntry = useMemo(() => {
    if (homeViewMonthKey === currentMonthKey) {
      return currentMonthBudgetEntry;
    }

    return budgetsByMonth?.[homeViewMonthKey] || null;
  }, [budgetsByMonth, currentMonthBudgetEntry, currentMonthKey, homeViewMonthKey]);

  const activeMonthlyIncome = currentMonthBudgetEntry?.monthlyIncome ?? 0;
  const activeBudgetSettings = currentMonthBudgetEntry?.budgetSettings ?? DEFAULT_BUDGET_SETTINGS;
  const activeSavingGoalSettings =
    currentMonthBudgetEntry?.savingGoalSettings ?? DEFAULT_SAVING_GOAL_SETTINGS;
  const selectedBudgetEntry = useMemo(() => {
    if (budgetPageMonthKey === currentMonthKey) {
      return currentMonthBudgetEntry;
    }

    return budgetsByMonth?.[budgetPageMonthKey] || null;
  }, [budgetPageMonthKey, budgetsByMonth, currentMonthBudgetEntry, currentMonthKey]);

  useEffect(() => {
    if (currentMonthBudgetEntry) {
      setMonthlyIncome(currentMonthBudgetEntry.monthlyIncome);
      setBudgetSettings(currentMonthBudgetEntry.budgetSettings || DEFAULT_BUDGET_SETTINGS);
      setSavingGoalSettings(
        currentMonthBudgetEntry.savingGoalSettings || DEFAULT_SAVING_GOAL_SETTINGS
      );
      return;
    }

    setMonthlyIncome(0);
    setBudgetSettings(DEFAULT_BUDGET_SETTINGS);
    setSavingGoalSettings(DEFAULT_SAVING_GOAL_SETTINGS);
  }, [currentMonthBudgetEntry]);

  const recurringTotal = useMemo(
    () =>
      recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [recurringExpenses]
  );

  const manualFixedExpenseAmount = toNumber(activeBudgetSettings.fixedExpenseAmount);
  const totalFixedExpense =
    manualFixedExpenseAmount +
    (activeBudgetSettings.autoIncludeRecurringExpenses ? recurringTotal : 0);

  const goalPlan = useMemo(() => {
    if (!activeBudgetSettings.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan(activeSavingGoalSettings);
  }, [activeBudgetSettings.goalEnabled, activeSavingGoalSettings]);

  const goalReserveForDailyBudget = activeBudgetSettings.goalEnabled ? goalPlan.dailyNeed : 0;
  const goalReserveForMonthlyBudget = activeBudgetSettings.goalEnabled ? goalPlan.monthlyNeed : 0;

  const currentDateKey = getDateKey(currentDate);
  const homeViewDateKey = getDateKey(homeViewDate);

  const displayMonthSpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => getMonthKeyFromValue(record.date) === currentMonthKey)
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [currentMonthKey, expenseRecords]
  );

  const budgetMonthSpent = useMemo(
    () =>
      expenseRecords
        .filter(
          (record) =>
            getMonthKeyFromValue(record.date) === currentMonthKey &&
            isRecordOnOrBeforeDate(record.date, currentDateKey)
        )
        .filter(
          (record) =>
            !(
              activeBudgetSettings.autoIncludeRecurringExpenses &&
              record.sourceRecurringId
            )
        )
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [activeBudgetSettings.autoIncludeRecurringExpenses, currentDateKey, currentMonthKey, expenseRecords]
  );

  const previousMonthKey = getPreviousMonthKey(currentDate);
  const previousMonthBudgetEntry = budgetsByMonth?.[previousMonthKey] || null;
  const calculatedAutomaticCarryOverAmount = useMemo(
    () =>
      calculateCarryOverForMonth({
        monthKey: currentMonthKey,
        budgetsByMonth,
        carryOverState,
        expenseRecords,
        recurringExpenses,
      }),
    [currentMonthKey, budgetsByMonth, carryOverState, expenseRecords, recurringExpenses]
  );

  const todaySpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => getDateKeyFromValue(record.date) === currentDateKey)
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [currentDateKey, expenseRecords]
  );

  const automaticCarryOverAmount = calculatedAutomaticCarryOverAmount;
  const selectedMonthAutomaticCarryOverAmount = useMemo(
    () =>
      calculateCarryOverForMonth({
        monthKey: budgetPageMonthKey,
        budgetsByMonth,
        carryOverState,
        expenseRecords,
        recurringExpenses,
      }),
    [budgetPageMonthKey, budgetsByMonth, carryOverState, expenseRecords, recurringExpenses]
  );

  const effectiveCarryOverAmount =
    activeBudgetSettings.carryOverEnabled
      ? activeBudgetSettings.manualCarryOverEnabled
        ? activeBudgetSettings.manualCarryOverAmount
        : automaticCarryOverAmount
      : '';

  const dailyBudget = useMemo(
    () =>
      calculateDailyBudget({
        monthlyIncome: activeMonthlyIncome,
        manualDailyBudget: activeBudgetSettings.useManualBudget
          ? activeBudgetSettings.manualDailyBudget
          : '',
        carryOver: effectiveCarryOverAmount,
        targetSavings: goalReserveForDailyBudget,
        emergencyFund: activeBudgetSettings.emergencyFundAmount,
        fixedExpenses: totalFixedExpense,
        spent: budgetMonthSpent,
        remainingDays,
      }),
    [
      activeBudgetSettings.autoIncludeRecurringExpenses,
      activeBudgetSettings.carryOverEnabled,
      activeBudgetSettings.emergencyFundAmount,
      activeBudgetSettings.fixedExpenseAmount,
      activeBudgetSettings.goalEnabled,
      activeBudgetSettings.manualCarryOverAmount,
      activeBudgetSettings.manualCarryOverEnabled,
      activeBudgetSettings.manualDailyBudget,
      activeBudgetSettings.useManualBudget,
      effectiveCarryOverAmount,
      goalReserveForDailyBudget,
      totalFixedExpense,
      budgetMonthSpent,
      activeMonthlyIncome,
      remainingDays,
      recurringTotal,
    ]
  );

  const monthlyBudgetBase = useMemo(
    () =>
      calculateMonthlyBudgetBase({
        monthlyIncome: activeMonthlyIncome,
        carryOver: effectiveCarryOverAmount,
        targetSavings: goalReserveForMonthlyBudget,
        emergencyFund: activeBudgetSettings.emergencyFundAmount,
        fixedExpenses: totalFixedExpense,
      }),
    [
      activeBudgetSettings.emergencyFundAmount,
      activeBudgetSettings.goalEnabled,
      effectiveCarryOverAmount,
      goalReserveForMonthlyBudget,
      activeMonthlyIncome,
      totalFixedExpense,
    ]
  );

  const alertState = useMemo(
    () => getAlertState({ spent: todaySpent, dailyBudget }),
    [dailyBudget, todaySpent]
  );

  const hasBudgetSetup =
    toNumber(activeMonthlyIncome) > 0 ||
    (activeBudgetSettings.useManualBudget && toNumber(activeBudgetSettings.manualDailyBudget) > 0);

  const homeRecurringTotal = recurringTotal;
  const homeBudgetSettings = homeViewBudgetEntry?.budgetSettings ?? DEFAULT_BUDGET_SETTINGS;
  const homeSavingGoalSettings =
    homeViewBudgetEntry?.savingGoalSettings ?? DEFAULT_SAVING_GOAL_SETTINGS;
  const homeMonthlyIncome = homeViewBudgetEntry?.monthlyIncome ?? 0;
  const homeManualFixedExpenseAmount = toNumber(homeBudgetSettings.fixedExpenseAmount);
  const homeTotalFixedExpense =
    homeManualFixedExpenseAmount +
    (homeBudgetSettings.autoIncludeRecurringExpenses ? homeRecurringTotal : 0);
  const homeGoalPlan = useMemo(() => {
    if (!homeBudgetSettings.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan(homeSavingGoalSettings);
  }, [homeBudgetSettings.goalEnabled, homeSavingGoalSettings]);

  const homeGoalReserveForDailyBudget = homeBudgetSettings.goalEnabled ? homeGoalPlan.dailyNeed : 0;
  const homeAutomaticCarryOverAmount = useMemo(
    () =>
      calculateCarryOverForMonth({
        monthKey: homeViewMonthKey,
        budgetsByMonth,
        carryOverState,
        expenseRecords,
        recurringExpenses,
      }),
    [homeViewMonthKey, budgetsByMonth, carryOverState, expenseRecords, recurringExpenses]
  );
  const homeEffectiveCarryOverAmount = homeBudgetSettings.carryOverEnabled
    ? homeBudgetSettings.manualCarryOverEnabled
      ? homeBudgetSettings.manualCarryOverAmount
      : homeAutomaticCarryOverAmount
    : '';
  const homeDateScopedBudget = useMemo(
    () =>
      calculateDateScopedDailyBudget({
        monthlyIncome: homeMonthlyIncome,
        manualDailyBudget: homeBudgetSettings.useManualBudget
          ? homeBudgetSettings.manualDailyBudget
          : '',
        carryOver: homeEffectiveCarryOverAmount,
        targetSavings: homeGoalReserveForDailyBudget,
        emergencyFund: homeBudgetSettings.emergencyFundAmount,
        fixedExpenses: homeTotalFixedExpense,
        expenseRecords,
        baseDate: homeViewDate,
        autoIncludeRecurringExpenses: homeBudgetSettings.autoIncludeRecurringExpenses,
      }),
    [
      expenseRecords,
      homeBudgetSettings.autoIncludeRecurringExpenses,
      homeBudgetSettings.emergencyFundAmount,
      homeBudgetSettings.fixedExpenseAmount,
      homeBudgetSettings.goalEnabled,
      homeBudgetSettings.manualDailyBudget,
      homeBudgetSettings.manualCarryOverEnabled,
      homeBudgetSettings.manualCarryOverAmount,
      homeBudgetSettings.useManualBudget,
      homeEffectiveCarryOverAmount,
      homeGoalReserveForDailyBudget,
      homeMonthlyIncome,
      homeTotalFixedExpense,
      homeViewDate,
    ]
  );
  const homeRemainingDays = homeDateScopedBudget.remainingDaysFromBaseDate;
  const homeDailyBudget = homeDateScopedBudget.dailyBudgetForBaseDate;
  const homeTodayAvailableAmount = homeDateScopedBudget.todayAvailableAmount;
  const homeTodaySpent = homeDateScopedBudget.todaySpent;
  const homeAlertStateForPreview = useMemo(
    () => getAlertState({ spent: homeTodaySpent, dailyBudget: homeDailyBudget }),
    [homeDailyBudget, homeTodaySpent]
  );
  const homeHasBudgetSetup =
    toNumber(homeMonthlyIncome) > 0 ||
    (homeBudgetSettings.useManualBudget && toNumber(homeBudgetSettings.manualDailyBudget) > 0);

  const handleHomeViewDateChange = (nextDate) => {
    const normalizedDate = getToday(nextDate);
    if (Number.isNaN(normalizedDate.getTime())) {
      return;
    }

    setHomeViewDate(normalizedDate);
    setIsHomeViewDateCustom(getDateKey(normalizedDate) !== getDateKey(currentDate));
  };

  const homeJudgmentSnapshot = useMemo(
    () =>
      getHomeJudgmentSnapshot({
        hasBudgetSetup: homeHasBudgetSetup,
        alertState: homeAlertStateForPreview,
        dailyBudget: homeDailyBudget,
        todaySpent: homeTodaySpent,
      }),
    [homeAlertStateForPreview, homeDailyBudget, homeHasBudgetSetup, homeTodaySpent]
  );

  const monthlyJudgmentSnapshot = useMemo(
    () =>
      getMonthlyJudgmentSnapshot({
        hasBudgetSetup,
        monthlyBudget: monthlyBudgetBase,
        monthSpent: budgetMonthSpent,
      }),
    [budgetMonthSpent, hasBudgetSetup, monthlyBudgetBase]
  );

  useEffect(() => {
    if (
      !currentUser?.email ||
      !activeBudgetSettings.carryOverEnabled ||
      activeBudgetSettings.manualCarryOverEnabled
    ) {
      return;
    }

    if (!previousMonthBudgetEntry) {
      return;
    }

    const previousMonthBudgetSettings =
      previousMonthBudgetEntry.budgetSettings || DEFAULT_BUDGET_SETTINGS;
    const previousMonthSavingGoalSettings =
      previousMonthBudgetEntry.savingGoalSettings || DEFAULT_SAVING_GOAL_SETTINGS;
    const previousMonthGoalPlan = previousMonthBudgetSettings.goalEnabled
      ? calculateGoalSavingPlan(previousMonthSavingGoalSettings)
      : emptyGoalPlan();
    const previousMonthRecurringTotal = previousMonthBudgetSettings.autoIncludeRecurringExpenses
      ? recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0)
      : 0;
    const previousMonthBudgetBase = calculateMonthlyBudgetBase({
      monthlyIncome: previousMonthBudgetEntry.monthlyIncome,
      carryOver: 0,
      targetSavings: previousMonthGoalPlan.monthlyNeed,
      emergencyFund: previousMonthBudgetSettings.emergencyFundAmount,
      fixedExpenses:
        toNumber(previousMonthBudgetSettings.fixedExpenseAmount) + previousMonthRecurringTotal,
    });
    const previousMonthSpent = expenseRecords
      .filter((record) => isSamePreviousMonth(new Date(record.date), currentDate))
      .filter(
        (record) =>
          !(
            previousMonthBudgetSettings.autoIncludeRecurringExpenses &&
            record.sourceRecurringId
          )
      )
      .reduce((sum, record) => sum + toNumber(record.amount), 0);
    const previousMonthRemainingAmount = previousMonthBudgetBase - previousMonthSpent;

    setCarryOverState((current) => {
      const currentSnapshots =
        current.monthlySnapshots && typeof current.monthlySnapshots === 'object'
          ? current.monthlySnapshots
          : {};
      const existingSnapshot = currentSnapshots[previousMonthKey];
      const nextSnapshot = {
        remainingAmount: previousMonthRemainingAmount,
        automaticCarryOverAmount: Math.max(0, previousMonthRemainingAmount),
        calculatedAt: new Date().toISOString(),
      };

      if (
        current.lastCalculatedMonth === currentMonthKey &&
        existingSnapshot &&
        Number(existingSnapshot.remainingAmount ?? existingSnapshot.automaticCarryOverAmount ?? 0) ===
          previousMonthRemainingAmount
      ) {
        return current;
      }

      return {
        lastCalculatedMonth: currentMonthKey,
        monthlySnapshots: {
          ...currentSnapshots,
          [previousMonthKey]: nextSnapshot,
        },
      };
    });
  }, [
    activeBudgetSettings.carryOverEnabled,
    activeBudgetSettings.manualCarryOverEnabled,
    currentMonthKey,
    currentUser?.email,
    currentDate,
    expenseRecords,
    previousMonthBudgetEntry,
    previousMonthKey,
    recurringExpenses,
  ]);

  useEffect(() => {
    setAlertStateState((current) =>
      current.lastState === alertState.key
        ? current
        : { dismissed: false, lastState: alertState.key }
    );
  }, [alertState.key]);

  useEffect(() => {
    if (!homeJudgmentSnapshot.message) {
      return;
    }

    const dateKey = homeViewDateKey;
    setAlertHistory((current) =>
      upsertDailyBudgetStatusAlertHistory(current, {
        alertType: 'daily-budget-status',
        dateKey,
        statusKey: homeJudgmentSnapshot.statusKey,
        statusLabel: homeJudgmentSnapshot.statusLabel,
        message: homeJudgmentSnapshot.message,
        relatedAmount: homeJudgmentSnapshot.relatedAmount,
        createdAt: buildDateTimeFromDateKey(dateKey),
        read: false,
      })
    );
  }, [homeJudgmentSnapshot, homeViewDateKey]);

  const handleLogin = (formState) => {
    const result = login(formState);
    if (result.ok) {
      setLoginState(loadJSON(KEYS.loginState, null));
      setUserProfile(loadJSON(KEYS.userProfile, null));

      const snapshot = loadNormalizedServiceState(
        String(result.user?.email || formState.email || '').trim().toLowerCase()
      );

      setMonthlyIncome(snapshot.monthlyIncome);
      setBudgetSettings(snapshot.budgetSettings);
      setBudgetsByMonth(snapshot.budgetsByMonth || {});
      setSavingGoalSettings(snapshot.savingGoalSettings);
      setExpenseRecords(snapshot.expenseRecords);
      setRecurringExpenses(snapshot.recurringExpenses);
      setAlertStateState(snapshot.alertState);
      setAlertHistory(snapshot.alertHistory);
      setBudgetPageMonthKey(currentMonthKey);
    }

    return result;
  };

  const handleSignup = (formState) => signup(formState);

  const handleLogout = () => {
    logout();
    setLoginState(null);
    setUserProfile(null);
    navigate('/login', { replace: true });
  };

  const handleResetData = () => {
    clearServiceStorage();
    setMonthlyIncome(0);
    setBudgetSettings(DEFAULT_BUDGET_SETTINGS);
    setBudgetsByMonth({});
    setSavingGoalSettings(DEFAULT_SAVING_GOAL_SETTINGS);
    setSavingGoals(DEFAULT_SAVING_GOALS);
    setExpenseRecords([]);
    setRecurringExpenses([]);
    setCarryOverState(DEFAULT_CARRY_OVER_STATE);
    setExpenseDraftDateKey(getDateKey(currentDate));
    setAlertStateState(DEFAULT_ALERT_STATE);
    setAlertHistory([]);
    setBudgetPageMonthKey(getMonthKey(getToday()));
  };

  const addExpenseRecord = (record) => {
    const nextRecord = {
      ...record,
      date: record.date || buildDateTimeFromDateKey(expenseDraftDateKey),
    };

    setExpenseRecords((current) => [createExpenseRecord(nextRecord), ...current]);
    setAlertStateState((current) => ({ ...current, dismissed: false }));
  };

  const updateExpenseRecord = (expenseId, nextRecord) => {
    setExpenseRecords((current) =>
      current.map((item) => (item.id === expenseId ? { ...item, ...nextRecord, id: item.id } : item))
    );
  };

  const deleteExpenseRecord = (expenseId) => {
    setExpenseRecords((current) => current.filter((item) => item.id !== expenseId));
  };

  const addRecurringExpense = (record) => {
    setRecurringExpenses((current) => [
      {
        id: crypto.randomUUID(),
        ...record,
      },
      ...current,
    ]);
  };

  const updateRecurringExpense = (recurringId, nextRecord) => {
    setRecurringExpenses((current) =>
      current.map((item) => (item.id === recurringId ? { ...item, ...nextRecord } : item))
    );
  };

  const deleteRecurringExpense = (recurringId) => {
    setRecurringExpenses((current) => current.filter((item) => item.id !== recurringId));
  };

  const updateBudgetSettings = ({
    monthKey,
    monthlyIncome: nextMonthlyIncome,
    budgetSettings: nextBudgetSettings,
    savingGoalSettings: nextSavingGoalSettings,
  }) => {
    const normalizedMonthKey = String(monthKey || currentMonthKey).trim() || currentMonthKey;
    const updatedAt = new Date().toISOString();

    setBudgetsByMonth((current) => {
      const existing = current[normalizedMonthKey];

      return {
        ...current,
        [normalizedMonthKey]: buildMonthlyBudgetSnapshot({
          monthlyIncome: nextMonthlyIncome,
          budgetSettings: nextBudgetSettings,
          savingGoalSettings: nextSavingGoalSettings,
          createdAt: existing?.createdAt || updatedAt,
          updatedAt,
        }),
      };
    });

    if (normalizedMonthKey === currentMonthKey) {
      setMonthlyIncome(toNumber(nextMonthlyIncome));
      setBudgetSettings(nextBudgetSettings);
      setSavingGoalSettings(nextSavingGoalSettings);
    }
  };

  const updateSavingGoals = (nextSavingGoals) => {
    setSavingGoals(Array.isArray(nextSavingGoals) ? nextSavingGoals : []);
  };

  const updateBudgetSettingsField = (field, value) => {
    setBudgetSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const dismissAlert = () => {
    setAlertStateState((current) => ({ ...current, dismissed: true }));
  };

  const clearAlertHistory = () => {
    setAlertHistory([]);
  };

  const markAlertHistoryRead = () => {
    setAlertHistory((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
  };

  const showToast = (message, tone = 'success') => {
    if (!message) {
      return;
    }

    setToast({
      id: crypto.randomUUID(),
      message,
      tone,
    });

    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const sharedProps = {
    currentUser,
    currentDate,
    homeViewDate,
    onHomeViewDateChange: handleHomeViewDateChange,
    dailyBudget: homeDailyBudget,
    todayAvailableAmount: homeTodayAvailableAmount,
    todaySpent: homeTodaySpent,
    alertState: homeAlertStateForPreview,
    alertDismissed: alertStateState.dismissed,
    alertHistory,
    fixedExpenseTotal: homeTotalFixedExpense,
    totalFixedExpense: homeTotalFixedExpense,
    manualFixedExpenseAmount,
    recurringTotal: homeRecurringTotal,
    displayMonthSpent,
    budgetMonthSpent: homeDateScopedBudget.pastSpentBeforeBaseDate,
    remainingDays: homeRemainingDays,
    hasBudgetSetup: homeHasBudgetSetup,
    monthlyJudgmentSnapshot,
  };

  return (
    <div className="app-shell">
      {showChrome ? <Header currentUser={currentUser} onLogout={handleLogout} /> : null}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Home
                  {...sharedProps}
                  onDismissAlert={dismissAlert}
                  onClearAlertHistory={clearAlertHistory}
                  onMarkAlertHistoryRead={markAlertHistoryRead}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/budget-settings"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <BudgetSettings
                  currentMonthKey={currentMonthKey}
                  selectedBudgetMonth={budgetPageMonthKey}
                  selectedBudgetEntry={selectedBudgetEntry}
                  savingGoals={savingGoals}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                  dailyBudget={dailyBudget}
                  remainingDays={remainingDays}
                  totalFixedExpense={totalFixedExpense}
                  automaticCarryOverAmount={selectedMonthAutomaticCarryOverAmount}
                  monthlyJudgmentSnapshot={monthlyJudgmentSnapshot}
                  onSave={updateBudgetSettings}
                  onSelectedBudgetMonthChange={setBudgetPageMonthKey}
                  onSavingGoalsChange={updateSavingGoals}
                  showToast={showToast}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/expense-records"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <ExpenseRecords
                  expenseRecords={expenseRecords}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                  selectedDateKey={expenseDraftDateKey}
                  dailyBudget={dailyBudget}
                  todaySpent={todaySpent}
                  hasBudgetSetup={hasBudgetSetup}
                  onAddExpenseRecord={addExpenseRecord}
                  onUpdateExpenseRecord={updateExpenseRecord}
                  onDeleteExpenseRecord={deleteExpenseRecord}
                  onAddRecurringExpense={addRecurringExpense}
                  onUpdateRecurringExpense={updateRecurringExpense}
                  onDeleteRecurringExpense={deleteRecurringExpense}
                  showToast={showToast}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Calendar
                  expenseRecords={expenseRecords}
                  budgetsByMonth={budgetsByMonth}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                  onSelectDate={setExpenseDraftDateKey}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/statistics"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Statistics
                  expenseRecords={expenseRecords}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={<Login currentUser={currentUser} onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={<Signup currentUser={currentUser} onSignup={handleSignup} />}
          />
          <Route
            path="/my-page"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <MyPage
                  currentUser={currentUser}
                  budgetSettings={budgetSettings}
                  savingGoalSettings={savingGoalSettings}
                  onLogout={handleLogout}
                  onResetData={handleResetData}
                />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to={isAuthed ? '/' : '/login'} replace />} />
        </Routes>
      </main>
      {showChrome ? <BottomNav /> : null}
    </div>
  );
}
