export function parseMoneyInput(value) {
  const normalizedValue = String(value).replaceAll(',', '').trim();

  if (normalizedValue === '') {
    return null;
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function formatKoreanWon(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return '-';
  }

  return `${new Intl.NumberFormat('ko-KR').format(Math.round(numericAmount))}원`;
}

export function getRemainingDaysInMonth(date = new Date()) {
  const current = new Date(date);

  if (Number.isNaN(current.getTime())) {
    return 0;
  }

  const lastDate = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  return Math.max(lastDate - current.getDate() + 1, 0);
}

export function calculateDailyBudget(monthlyIncome, date = new Date()) {
  const income = Number(monthlyIncome);
  const remainingDays = getRemainingDaysInMonth(date);

  if (!Number.isFinite(income) || income <= 0 || remainingDays <= 0) {
    return 0;
  }

  return Math.floor(income / remainingDays);
}

function sanitizeBudgetAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount);
}

export function normalizeBudgetSettings(budgetSettings = {}) {
  return {
    manualDailyBudget: sanitizeBudgetAmount(budgetSettings.manualDailyBudget),
    carryOverEnabled: Boolean(budgetSettings.carryOverEnabled),
    carryOverAmount: sanitizeBudgetAmount(budgetSettings.carryOverAmount),
    savingGoalAmount: sanitizeBudgetAmount(budgetSettings.savingGoalAmount),
    emergencyFundAmount: sanitizeBudgetAmount(budgetSettings.emergencyFundAmount),
  };
}

export function calculateBudgetPlan({
  monthlyIncome,
  budgetSettings = {},
  date = new Date(),
} = {}) {
  const income = sanitizeBudgetAmount(monthlyIncome);
  const settings = normalizeBudgetSettings(budgetSettings);
  const remainingDays = getRemainingDaysInMonth(date);
  const savingGoalAmount = Math.min(settings.savingGoalAmount, income);
  const remainingAfterSavingGoal = Math.max(income - savingGoalAmount, 0);
  const emergencyFundAmount = Math.min(settings.emergencyFundAmount, remainingAfterSavingGoal);
  const spendableMonthlyIncome = Math.max(remainingAfterSavingGoal - emergencyFundAmount, 0);
  const autoDailyBudget =
    spendableMonthlyIncome > 0 && remainingDays > 0
      ? Math.floor(spendableMonthlyIncome / remainingDays)
      : 0;
  const manualDailyBudget = settings.manualDailyBudget > 0 ? settings.manualDailyBudget : 0;
  const carryOverAmount = settings.carryOverEnabled ? settings.carryOverAmount : 0;
  const baseDailyBudget = manualDailyBudget > 0 ? manualDailyBudget : autoDailyBudget;
  const availableDailyBudget = baseDailyBudget + carryOverAmount;

  return {
    monthlyIncome: income,
    remainingDays,
    savingGoalAmount,
    emergencyFundAmount,
    spendableMonthlyIncome,
    autoDailyBudget,
    manualDailyBudget,
    carryOverEnabled: settings.carryOverEnabled,
    carryOverAmount,
    baseDailyBudget,
    availableDailyBudget,
    isManualBudgetActive: manualDailyBudget > 0,
    isCarryOverActive: settings.carryOverEnabled && carryOverAmount > 0,
  };
}

export function judgeSpending({ spendingAmount, dailyBudget }) {
  const spending = Number(spendingAmount);
  const budget = Number(dailyBudget);

  if (spendingAmount === null || spendingAmount === undefined || !Number.isFinite(spending)) {
    return {
      status: 'invalid',
      title: '지출 금액을 확인해 주세요.',
      message: '지출 금액은 숫자로 입력해 주세요.',
      warning: '',
    };
  }

  if (spending <= 0) {
    return {
      status: 'invalid',
      title: '지출 금액을 확인해 주세요.',
      message: '지출 금액은 0보다 큰 숫자로 입력해 주세요.',
      warning: '',
    };
  }

  if (!Number.isFinite(budget) || budget <= 0) {
    return {
      status: 'over',
      title: '예산 초과',
      message: '현재 사용할 수 있는 하루 예산이 없습니다.',
      warning: '경고: 월 수입을 먼저 입력해 예산을 계산해 주세요.',
    };
  }

  if (spending > budget) {
    return {
      status: 'over',
      title: '예산 초과',
      message: '입력한 금액이 오늘 예산을 넘었습니다.',
      warning: '경고: 오늘 예산을 초과했습니다.',
    };
  }

  return {
    status: 'within',
    title: '예산 안에서 사용할 수 있습니다.',
    message: '입력한 금액은 현재 예산 안에 있습니다.',
    warning: '',
  };
}
