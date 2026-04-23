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

function createEmptySpendingStage() {
  return {
    status: 'stable',
    title: '안정',
    message: '현재 소비는 예산 안에서 여유 있게 관리되고 있습니다.',
    warning: '',
    usageRate: 0,
    remainingBudget: 0,
  };
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

function sumExpenseAmountByMonth(expenseRecords = [], year = 0, monthIndex = 0) {
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;

  return expenseRecords.reduce((total, record) => {
    if (typeof record?.date !== 'string' || !record.date.startsWith(monthPrefix)) {
      return total;
    }

    const amount = Number(record?.amount);
    return Number.isFinite(amount) && amount > 0 ? total + amount : total;
  }, 0);
}

function getSpendingStage(spendingAmount, dailyBudget) {
  const spending = Number(spendingAmount);
  const budget = Number(dailyBudget);

  if (spendingAmount === null || spendingAmount === undefined || !Number.isFinite(spending)) {
    return {
      status: 'invalid',
      title: '지출 금액을 확인해 주세요.',
      message: '지출 금액은 숫자로 입력해 주세요.',
      warning: '',
      usageRate: 0,
      remainingBudget: Number.isFinite(budget) ? Math.max(budget, 0) : 0,
    };
  }

  if (spending <= 0) {
    return {
      status: 'invalid',
      title: '지출 금액을 확인해 주세요.',
      message: '지출 금액은 0보다 큰 숫자로 입력해 주세요.',
      warning: '',
      usageRate: 0,
      remainingBudget: Number.isFinite(budget) ? Math.max(budget, 0) : 0,
    };
  }

  if (!Number.isFinite(budget) || budget <= 0) {
    return {
      status: 'over',
      title: '초과',
      message: '현재 사용할 수 있는 오늘 예산이 없습니다.',
      warning: '경고: 월 수입과 이월 규칙을 먼저 저장해 주세요.',
      usageRate: 1,
      remainingBudget: 0,
    };
  }

  const usageRate = spending / budget;
  const remainingBudget = Math.max(budget - spending, 0);

  if (usageRate >= 1) {
    return {
      status: 'over',
      title: '초과',
      message: '입력한 금액이 오늘 최종 사용 가능 금액을 넘었습니다.',
      warning: '경고: 오늘 예산을 초과했습니다.',
      usageRate,
      remainingBudget,
    };
  }

  if (usageRate >= 0.75) {
    return {
      status: 'warning',
      title: '경고',
      message: '오늘 예산의 대부분을 사용했습니다. 추가 소비를 조심하세요.',
      warning: '주의: 예산이 거의 다 사용되었습니다.',
      usageRate,
      remainingBudget,
    };
  }

  if (usageRate >= 0.5) {
    return {
      status: 'watch',
      title: '주의',
      message: '오늘 예산의 절반 이상을 사용했습니다.',
      warning: '주의: 남은 금액을 확인하고 소비를 조절해 주세요.',
      usageRate,
      remainingBudget,
    };
  }

  return {
    status: 'stable',
    title: '안정',
    message: '현재 소비는 예산 안에서 여유 있게 관리되고 있습니다.',
    warning: '',
    usageRate,
    remainingBudget,
  };
}

function buildBudgetAlert({
  type,
  title,
  message,
  detail,
  currentAmount,
  limitAmount,
  signature,
  resetLabel,
}) {
  return {
    type,
    title,
    message,
    detail,
    currentAmount,
    limitAmount,
    signature,
    resetLabel,
    tone: 'error',
  };
}

export function isBudgetAlertDismissed(alertState = {}, alert = {}) {
  if (alert?.type === 'daily') {
    return alertState?.dismissedDailySignature === alert?.signature;
  }

  if (alert?.type === 'monthly') {
    return alertState?.dismissedMonthlySignature === alert?.signature;
  }

  return false;
}

export function getVisibleBudgetAlerts(alerts = [], alertState = {}) {
  return alerts.filter((alert) => !isBudgetAlertDismissed(alertState, alert));
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
      monthlySpent: 0,
      monthlyBudgetLimit: 0,
      monthlyRemainingBudget: 0,
      isManualBudgetActive: settings.manualDailyBudget > 0,
      isCarryOverActive: false,
      spentToday: 0,
      dailySnapshots: [],
      spendingStage: createEmptySpendingStage(),
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
  const monthlySpent = sumExpenseAmountByMonth(expenseRecords, year, month);
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
    monthlySpent,
    monthlyBudgetLimit: spendableMonthlyIncome,
    monthlyRemainingBudget: Math.max(spendableMonthlyIncome - monthlySpent, 0),
    isManualBudgetActive: manualDailyBudget > 0,
    isCarryOverActive: settings.carryOverEnabled && todaySnapshot.carryIn > 0,
    spentToday: todaySnapshot.spentAmount,
    dailySnapshots,
    spendingStage: getSpendingStage(todaySnapshot.spentAmount, todaySnapshot.availableDailyBudget),
  };
}

export function calculateBudgetAlerts({
  monthlyIncome,
  budgetSettings = {},
  expenseRecords = [],
  date = new Date(),
  budgetPlan,
} = {}) {
  const currentPlan =
    budgetPlan ??
    calculateBudgetPlan({
      monthlyIncome,
      budgetSettings,
      expenseRecords,
      date,
    });
  const currentDate = new Date(date);

  if (Number.isNaN(currentDate.getTime())) {
    return {
      alerts: [],
      monthlySpent: 0,
      monthlyLimit: currentPlan.monthlyBudgetLimit ?? 0,
      dailyAlert: null,
      monthlyAlert: null,
    };
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dateKey = formatDateKey(currentDate);
  const monthlySpent = currentPlan.monthlySpent ?? sumExpenseAmountByMonth(expenseRecords, year, month);
  const monthlyLimit = currentPlan.monthlyBudgetLimit ?? 0;

  const alerts = [];

  const dailyAlert =
    currentPlan.spendingStage.status === 'over'
      ? buildBudgetAlert({
          type: 'daily',
          title: '하루 예산 초과',
          message: '오늘 사용 가능 금액을 넘었습니다.',
          detail: `오늘 사용한 금액 ${formatKoreanWon(currentPlan.spentToday)} / 오늘 사용 가능 금액 ${formatKoreanWon(currentPlan.availableDailyBudget)}`,
          currentAmount: currentPlan.spentToday,
          limitAmount: currentPlan.availableDailyBudget,
          signature: `daily:${dateKey}:${currentPlan.availableDailyBudget}:${currentPlan.spentToday}`,
          resetLabel: '하루 초과 기준 재설정',
        })
      : null;

  const monthlyAlert =
    monthlySpent > monthlyLimit
      ? buildBudgetAlert({
          type: 'monthly',
          title: '월 예산 초과',
          message: '이번 달 누적 지출이 사용 가능 월 예산을 넘었습니다.',
          detail: `이번 달 사용한 금액 ${formatKoreanWon(monthlySpent)} / 이번 달 사용 가능 금액 ${formatKoreanWon(monthlyLimit)}`,
          currentAmount: monthlySpent,
          limitAmount: monthlyLimit,
          signature: `monthly:${monthKey}:${monthlySpent}:${monthlyLimit}`,
          resetLabel: '월 초과 기준 재설정',
        })
      : null;

  if (dailyAlert) {
    alerts.push(dailyAlert);
  }

  if (monthlyAlert) {
    alerts.push(monthlyAlert);
  }

  return {
    alerts,
    monthlySpent,
    monthlyLimit,
    dailyAlert,
    monthlyAlert,
  };
}

export function judgeSpending({ spendingAmount, dailyBudget }) {
  const stage = getSpendingStage(spendingAmount, dailyBudget);

  if (stage.status === 'stable') {
    return {
      ...stage,
      title: '안정',
      message: '입력한 금액은 현재 예산 안에 있습니다.',
      warning: '',
    };
  }

  if (stage.status === 'watch') {
    return {
      ...stage,
      title: '주의',
      message: '입력한 금액은 예산의 절반을 넘었습니다.',
    };
  }

  if (stage.status === 'warning') {
    return {
      ...stage,
      title: '경고',
      message: '입력한 금액이 예산에 거의 다가왔습니다.',
    };
  }

  if (stage.status === 'over') {
    return {
      ...stage,
      title: '초과',
      message: '입력한 금액이 오늘 최종 사용 가능 금액을 넘었습니다.',
    };
  }

  return stage;
}
