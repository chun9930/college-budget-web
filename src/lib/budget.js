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

function formatDateKey(date = new Date()) {
  const current = new Date(date);

  if (Number.isNaN(current.getTime())) {
    return '';
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
    savingGoalAmount: sanitizeBudgetAmount(budgetSettings.savingGoalAmount),
    emergencyFundAmount: sanitizeBudgetAmount(budgetSettings.emergencyFundAmount),
  };
}

function sumExpenseAmountByDate(expenseRecords = [], dateKey = '') {
  return expenseRecords.reduce((total, record) => {
    if (record?.date !== dateKey) {
      return total;
    }

    const amount = Number(record?.amount);
    return Number.isFinite(amount) && amount > 0 ? total + amount : total;
  }, 0);
}

export function calculateBudgetPlan({
  monthlyIncome,
  budgetSettings = {},
  expenseRecords = [],
  date = new Date(),
} = {}) {
  const income = sanitizeBudgetAmount(monthlyIncome);
  const settings = normalizeBudgetSettings(budgetSettings);
  const currentDate = new Date(date);

  if (Number.isNaN(currentDate.getTime())) {
    return {
      monthlyIncome: income,
      remainingDays: 0,
      savingGoalAmount: 0,
      emergencyFundAmount: 0,
      spendableMonthlyIncome: 0,
      autoDailyBudget: 0,
      manualDailyBudget: settings.manualDailyBudget,
      carryOverEnabled: settings.carryOverEnabled,
      carryOverAmount: 0,
      baseDailyBudget: 0,
      availableDailyBudget: 0,
      isManualBudgetActive: settings.manualDailyBudget > 0,
      isCarryOverActive: false,
      spentToday: 0,
      dailySnapshots: [],
    };
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const targetDay = currentDate.getDate();
  const dailySnapshots = [];
  const savingGoalAmount = Math.min(settings.savingGoalAmount, income);
  const remainingAfterSavingGoal = Math.max(income - savingGoalAmount, 0);
  const emergencyFundAmount = Math.min(settings.emergencyFundAmount, remainingAfterSavingGoal);
  const spendableMonthlyIncome = Math.max(remainingAfterSavingGoal - emergencyFundAmount, 0);
  const manualDailyBudget = settings.manualDailyBudget > 0 ? settings.manualDailyBudget : 0;
  let carryIn = 0;

  for (let day = 1; day <= targetDay; day += 1) {
    const currentDayDate = new Date(year, month, day);
    const currentDateKey = formatDateKey(currentDayDate);
    const remainingDays = getRemainingDaysInMonth(currentDayDate);
    const autoDailyBudget =
      spendableMonthlyIncome > 0 && remainingDays > 0
        ? Math.floor(spendableMonthlyIncome / remainingDays)
        : 0;
    const baseDailyBudget = manualDailyBudget > 0 ? manualDailyBudget : autoDailyBudget;
    const availableBeforeSpent = baseDailyBudget + (settings.carryOverEnabled ? carryIn : 0);
    const spentAmount = sumExpenseAmountByDate(expenseRecords, currentDateKey);
    const carryOut = settings.carryOverEnabled
      ? Math.max(availableBeforeSpent - spentAmount, 0)
      : 0;

    dailySnapshots.push({
      date: currentDateKey,
      remainingDays,
      autoDailyBudget,
      baseDailyBudget,
      carryIn,
      spentAmount,
      availableDailyBudget: availableBeforeSpent,
      carryOut,
    });

    carryIn = carryOut;
  }

  const todaySnapshot = dailySnapshots[dailySnapshots.length - 1] ?? {
    remainingDays: 0,
    autoDailyBudget: 0,
    baseDailyBudget: manualDailyBudget,
    carryIn: 0,
    spentAmount: 0,
    availableDailyBudget: 0,
    carryOut: 0,
  };

  return {
    monthlyIncome: income,
    remainingDays: todaySnapshot.remainingDays,
    savingGoalAmount,
    emergencyFundAmount,
    spendableMonthlyIncome,
    autoDailyBudget: todaySnapshot.autoDailyBudget,
    manualDailyBudget,
    carryOverEnabled: settings.carryOverEnabled,
    carryOverAmount: todaySnapshot.carryIn,
    baseDailyBudget: todaySnapshot.baseDailyBudget,
    availableDailyBudget: todaySnapshot.availableDailyBudget,
    isManualBudgetActive: manualDailyBudget > 0,
    isCarryOverActive: settings.carryOverEnabled && todaySnapshot.carryIn > 0,
    spentToday: todaySnapshot.spentAmount,
    dailySnapshots,
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
