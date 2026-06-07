function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getToday(date = new Date()) {
  const current = new Date(date);
  return new Date(current.getFullYear(), current.getMonth(), current.getDate());
}

function toDateStart(value) {
  const date = getToday(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getMonthKey(date = new Date()) {
  const current = getToday(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousMonthKey(date = new Date()) {
  const current = getToday(date);
  const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  return getMonthKey(previous);
}

function toSafeAmount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateNetWorkMonthlyIncome({
  hourlyWage = 0,
  workHoursPerDay = 0,
  workDaysPerWeek = 0,
  monthlyMultiplier = 4.345,
  withholdingRate = 0.033,
} = {}) {
  const grossMonthlyIncome =
    toNumber(hourlyWage) * toNumber(workHoursPerDay) * toNumber(workDaysPerWeek) * monthlyMultiplier;

  return Math.round(grossMonthlyIncome * (1 - withholdingRate));
}

function getDateKey(date = new Date()) {
  const current = getToday(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
    current.getDate()
  ).padStart(2, '0')}`;
}

function getDaysInMonth(date = new Date()) {
  const current = getToday(date);
  return new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
}

export function getRemainingDaysIncludingToday(date = new Date()) {
  const current = getToday(date);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const diff = endOfMonth.getDate() - current.getDate() + 1;
  return diff > 0 ? diff : 1;
}

export function calculateDailyBudget({
  monthlyIncome = 0,
  manualDailyBudget = '',
  carryOver = '',
  targetSavings = '',
  emergencyFund = '',
  fixedExpenses = '',
  spent = '',
  remainingDays = 1,
} = {}) {
  const manualBudget = toNumber(manualDailyBudget);
  if (manualBudget > 0) {
    return manualBudget;
  }

  const safeRemainingDays = remainingDays > 0 ? remainingDays : 1;
  const availableAmount =
    toNumber(monthlyIncome) +
    toNumber(carryOver) -
    toNumber(targetSavings) -
    toNumber(emergencyFund) -
    toNumber(fixedExpenses) -
    toNumber(spent);

  return Math.max(0, availableAmount / safeRemainingDays);
}

export function calculateDateScopedDailyBudget({
  monthlyIncome = 0,
  manualDailyBudget = '',
  carryOver = '',
  targetSavings = '',
  emergencyFund = '',
  fixedExpenses = '',
  expenseRecords = [],
  baseDate = new Date(),
  autoIncludeRecurringExpenses = false,
} = {}) {
  const normalizedBaseDate = getToday(baseDate);
  const baseDateKey = getDateKey(normalizedBaseDate);
  const monthKey = getMonthKey(normalizedBaseDate);
  const manualBudget = toNumber(manualDailyBudget);
  const monthlyAvailableBudget = calculateMonthlyBudgetBase({
    monthlyIncome,
    carryOver,
    targetSavings,
    emergencyFund,
    fixedExpenses,
  });
  const scopedRecords = Array.isArray(expenseRecords)
    ? expenseRecords.filter((record) => {
        if (!record) {
          return false;
        }

        if (getMonthKey(record.date) !== monthKey) {
          return false;
        }

        if (autoIncludeRecurringExpenses && record.sourceRecurringId) {
          return false;
        }

        return true;
      })
    : [];
  const pastSpentBeforeBaseDate = scopedRecords
    .filter((record) => getDateKey(record.date) < baseDateKey)
    .reduce((sum, record) => sum + toSafeAmount(record.amount), 0);
  const todaySpent = scopedRecords
    .filter((record) => getDateKey(record.date) === baseDateKey)
    .reduce((sum, record) => sum + toSafeAmount(record.amount), 0);
  const remainingBudgetAtBaseDate = Math.max(0, monthlyAvailableBudget - pastSpentBeforeBaseDate);
  const remainingDaysFromBaseDate = getRemainingDaysIncludingToday(normalizedBaseDate);
  const budgetPeriodDays = getDaysInMonth(normalizedBaseDate);
  const elapsedDaysBeforeBaseDate = Math.max(normalizedBaseDate.getDate() - 1, 0);
  const baseDailyBudget = manualBudget > 0 ? manualBudget : monthlyAvailableBudget / budgetPeriodDays;
  const plannedBudgetBeforeBaseDate = baseDailyBudget * elapsedDaysBeforeBaseDate;
  const pastOverspend = Math.max(pastSpentBeforeBaseDate - plannedBudgetBeforeBaseDate, 0);
  const overspendAdjustment =
    remainingDaysFromBaseDate > 0 ? pastOverspend / remainingDaysFromBaseDate : pastOverspend;
  const dailyBudgetForBaseDate =
    manualBudget > 0
      ? manualBudget
      : Math.max(baseDailyBudget - overspendAdjustment, 0);
  const todayAvailableAmount = Math.max(0, dailyBudgetForBaseDate - todaySpent);

  return {
    monthlyAvailableBudget,
    budgetPeriodDays,
    baseDailyBudget,
    elapsedDaysBeforeBaseDate,
    plannedBudgetBeforeBaseDate,
    pastSpentBeforeBaseDate,
    pastOverspend,
    todaySpent,
    remainingBudgetAtBaseDate,
    remainingDaysFromBaseDate,
    overspendAdjustment,
    dailyBudgetForBaseDate,
    todayAvailableAmount,
  };
}

export function calculateMonthlyBudgetBase({
  monthlyIncome = 0,
  carryOver = '',
  targetSavings = '',
  emergencyFund = '',
  fixedExpenses = '',
} = {}) {
  return Math.max(
    0,
    toNumber(monthlyIncome) +
      toNumber(carryOver) -
      toNumber(targetSavings) -
      toNumber(emergencyFund) -
      toNumber(fixedExpenses)
  );
}

export function calculateAutomaticCarryOver({
  previousMonthBudgetBase = 0,
  spent = '',
  hasPreviousMonthBudgetSnapshot = true,
} = {}) {
  if (!hasPreviousMonthBudgetSnapshot) {
    return 0;
  }

  return Math.max(0, toNumber(previousMonthBudgetBase) - toNumber(spent));
}

export function calculateGoalSavingPlan({
  goalAmount = '',
  currentSaving = '',
  goalPeriod = '',
} = {}) {
  const totalGoal = Math.max(0, toNumber(goalAmount));
  const savedAmount = Math.max(0, toNumber(currentSaving));
  const remainingAmount = Math.max(0, totalGoal - savedAmount);
  const safePeriod = Math.max(1, toNumber(goalPeriod));
  const dailyNeed = Math.ceil(remainingAmount / safePeriod);
  const weeklyNeed = Math.min(dailyNeed * 7, remainingAmount);
  const monthlyNeed = Math.min(dailyNeed * 30, remainingAmount);

  return {
    remainingAmount,
    dailyNeed,
    weeklyNeed,
    monthlyNeed,
  };
}

export function calculateSavingGoalListSummary(goals = [], today = getToday()) {
  const todayStart = toDateStart(today);

  return goals.map((goal) => {
    const targetAmount = Math.max(0, toNumber(goal?.targetAmount));
    const currentAmount = Math.max(0, toNumber(goal?.currentAmount));
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const deadlineStart = toDateStart(goal?.deadline);
    const remainingDays =
      todayStart && deadlineStart
        ? Math.max(
            0,
            Math.ceil((deadlineStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
          )
        : 0;
    const remainingMonths = remainingDays > 0 ? Math.max(1, Math.ceil(remainingDays / 30.44)) : 0;

    return {
      ...goal,
      targetAmount,
      currentAmount,
      remainingAmount,
      remainingDays,
      remainingMonths,
      dailyNeed: remainingDays > 0 ? remainingAmount / remainingDays : 0,
      monthlyNeed: remainingMonths > 0 ? remainingAmount / remainingMonths : 0,
      achievementRate: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
      isOverdue: Boolean(deadlineStart && todayStart && deadlineStart < todayStart && remainingAmount > 0),
      isCompleted: Boolean(targetAmount > 0 && currentAmount >= targetAmount),
    };
  });
}

function getMonthlyRecords(expenseRecords = [], monthDate = getToday(), includeRecurringSource = true) {
  const monthKey = getMonthKey(monthDate);

  return expenseRecords.filter((record) => {
    if (!record) {
      return false;
    }

    if (!includeRecurringSource && record.sourceRecurringId) {
      return false;
    }

    return getMonthKey(record.date) === monthKey;
  });
}

export function getCategorySpendingSummary(
  expenseRecords = [],
  today = getToday(),
  { includeRecurringSource = true } = {}
) {
  const currentMonthRecords = getMonthlyRecords(expenseRecords, today, includeRecurringSource);
  const monthlyTotal = currentMonthRecords.reduce(
    (sum, record) => sum + toSafeAmount(record.amount),
    0
  );

  const categoryMap = currentMonthRecords.reduce((accumulator, record) => {
    const key = record?.category || '기타';
    accumulator[key] = (accumulator[key] || 0) + toSafeAmount(record.amount);
    return accumulator;
  }, {});

  const categoryEntries = Object.entries(categoryMap)
    .map(([category, amount]) => {
      const ratio = monthlyTotal > 0 ? Math.round((amount / monthlyTotal) * 100) : 0;
      return {
        category,
        amount,
        ratio,
      };
    })
    .sort((left, right) => right.amount - left.amount);

  const topCategory = categoryEntries[0] || {
    category: '기타',
    amount: 0,
    ratio: 0,
  };

  return {
    currentMonthKey: getMonthKey(today),
    monthlyTotal,
    recordsCount: currentMonthRecords.length,
    currentMonthRecords,
    categoryEntries,
    topCategory,
    topCategoryRatio: topCategory.ratio,
    hasRecurringSourceRecords: currentMonthRecords.some((record) => record.sourceRecurringId),
  };
}

export function getMonthlySpendingComparison(
  expenseRecords = [],
  today = getToday(),
  { includeRecurringSource = true } = {}
) {
  const currentMonthRecords = getMonthlyRecords(expenseRecords, today, includeRecurringSource);
  const previousMonthDate = new Date(today);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthRecords = getMonthlyRecords(
    expenseRecords,
    previousMonthDate,
    includeRecurringSource
  );

  const currentCategoryMap = currentMonthRecords.reduce((accumulator, record) => {
    const key = record?.category || '기타';
    accumulator[key] = (accumulator[key] || 0) + toSafeAmount(record.amount);
    return accumulator;
  }, {});

  const previousCategoryMap = previousMonthRecords.reduce((accumulator, record) => {
    const key = record?.category || '기타';
    accumulator[key] = (accumulator[key] || 0) + toSafeAmount(record.amount);
    return accumulator;
  }, {});

  const currentMonthTotal = Object.values(currentCategoryMap).reduce((sum, amount) => sum + amount, 0);
  const previousMonthTotal = Object.values(previousCategoryMap).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const categoryComparisons = Array.from(
    new Set([...Object.keys(currentCategoryMap), ...Object.keys(previousCategoryMap)])
  )
    .map((category) => {
      const currentAmount = currentCategoryMap[category] || 0;
      const previousAmount = previousCategoryMap[category] || 0;
      const changeAmount = currentAmount - previousAmount;
      const changeRate =
        previousAmount > 0 ? Math.round((changeAmount / previousAmount) * 100) : currentAmount > 0 ? 100 : 0;

      return {
        category,
        currentAmount,
        previousAmount,
        changeAmount,
        changeRate,
        ratio: currentMonthTotal > 0 ? Math.round((currentAmount / currentMonthTotal) * 100) : 0,
      };
    })
    .sort((left, right) => right.currentAmount - left.currentAmount);

  const biggestIncreaseCategory =
    categoryComparisons
      .filter((item) => item.changeAmount > 0)
      .sort((left, right) => right.changeAmount - left.changeAmount)[0] || null;

  const biggestDecreaseCategory =
    categoryComparisons
      .filter((item) => item.changeAmount < 0)
      .sort((left, right) => left.changeAmount - right.changeAmount)[0] || null;

  return {
    currentMonthKey: getMonthKey(today),
    previousMonthKey: getPreviousMonthKey(today),
    currentMonthTotal,
    previousMonthTotal,
    changeAmount: currentMonthTotal - previousMonthTotal,
    changeRate:
      previousMonthTotal > 0
        ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
        : currentMonthTotal > 0
          ? 100
          : 0,
    categoryComparisons,
    biggestIncreaseCategory,
    biggestDecreaseCategory,
  };
}

export function getOverspendingFeedback(categorySummary, monthlyComparison) {
  const cards = [];
  const topCategory = categorySummary?.topCategory;
  const recordsCount = categorySummary?.recordsCount || 0;
  const monthlyTotal = categorySummary?.monthlyTotal || 0;
  const biggestIncreaseCategory = monthlyComparison?.biggestIncreaseCategory;

  if (recordsCount === 0 || monthlyTotal === 0) {
    return [
      {
        tone: 'neutral',
        title: '분석할 지출 기록이 더 필요합니다',
        message: '지출을 더 저장하면 카테고리 비중과 전월 대비 변화를 더 정확하게 볼 수 있어요.',
        detail: '기록이 없으면 소비 패턴 분석을 시작할 수 없습니다.',
      },
    ];
  }

  if (topCategory && topCategory.amount > 0 && topCategory.ratio >= 40) {
    cards.push({
      tone: 'warning',
      title: '과소비 가능성',
      category: topCategory.category,
      amount: topCategory.amount,
      ratio: topCategory.ratio,
      message: `${topCategory.category}가 전체 지출의 ${topCategory.ratio}%입니다. 이번 주 지출 횟수나 1회 금액을 줄이면 예산 유지에 도움이 됩니다.`,
      detail: `${topCategory.category} ${topCategory.ratio}% · ${topCategory.amount.toLocaleString('ko-KR')}원`,
    });
  }

  if (biggestIncreaseCategory && biggestIncreaseCategory.changeAmount > 0) {
    cards.push({
      tone: 'trend',
      title: '지난달보다 늘어난 항목',
      category: biggestIncreaseCategory.category,
      amount: biggestIncreaseCategory.currentAmount,
      previousAmount: biggestIncreaseCategory.previousAmount,
      changeAmount: biggestIncreaseCategory.changeAmount,
      changeRate: biggestIncreaseCategory.changeRate,
      message: `${biggestIncreaseCategory.category} 지출이 지난달보다 ${biggestIncreaseCategory.changeAmount.toLocaleString('ko-KR')}원 늘었습니다. 빈도나 1회 지출 금액을 점검해보세요.`,
      detail: `지난달 ${biggestIncreaseCategory.previousAmount.toLocaleString('ko-KR')}원 → 이번 달 ${biggestIncreaseCategory.currentAmount.toLocaleString('ko-KR')}원`,
    });
  }

  if (monthlyComparison && monthlyComparison.changeAmount > 0) {
    cards.push({
      tone: 'summary',
      title: '이번 달 총지출 증가',
      message: `이번 달 총지출이 지난달보다 ${monthlyComparison.changeAmount.toLocaleString('ko-KR')}원 증가했습니다. 늘어난 카테고리를 먼저 확인해보세요.`,
      detail: `이번 달 ${monthlyComparison.currentMonthTotal.toLocaleString('ko-KR')}원 · 지난달 ${monthlyComparison.previousMonthTotal.toLocaleString('ko-KR')}원`,
    });
  }

  if (recordsCount < 3) {
    cards.push({
      tone: 'neutral',
      title: '분석 정확도 안내',
      message: '분석할 지출 기록이 더 필요합니다. 기록이 더 쌓이면 카테고리별 변화와 소비 패턴을 더 정확하게 볼 수 있어요.',
      detail: '현재 기록 수가 적어서 전월 비교 해석은 보수적으로 보는 것이 좋습니다.',
    });
  }

  if (cards.length === 0) {
    cards.push({
      tone: 'stable',
      title: '지출 패턴이 안정적입니다',
      message: `이번 달 ${topCategory.category}이(가) 가장 큰 비중을 차지하지만, 급격한 증가 카테고리는 아직 보이지 않습니다.`,
      detail: '기록이 더 쌓이면 더 구체적인 패턴 분석이 가능합니다.',
    });
  }

  return cards.slice(0, 3);
}

const STUDENT_SAVINGS_TIP_LIBRARY = {
  식비: [
    {
      reason: '식비는 학생 예산에서 가장 빨리 커지는 항목입니다.',
      action: '이번 주 2회는 학생식당이나 교내 식사를 먼저 선택해보세요.',
    },
    {
      reason: '외식 횟수를 줄이면 월 지출이 바로 내려갑니다.',
      action: '점심과 저녁 중 한 끼만 외식으로 남겨보세요.',
    },
    {
      reason: '장보기 전 계획이 있으면 충동구매를 줄일 수 있습니다.',
      action: '주간 장보기 목록을 미리 적어두고 필요한 것만 사보세요.',
    },
  ],
  카페: [
    {
      reason: '카페 지출은 작은 금액이 자주 쌓이기 쉽습니다.',
      action: '텀블러 할인과 멤버십 적립을 먼저 확인해보세요.',
    },
    {
      reason: '학교 안에서 대체할 수 있는 음료 소비가 있습니다.',
      action: '교내 카페나 편의점 대체 메뉴를 한 번 비교해보세요.',
    },
    {
      reason: '습관성 커피 구매는 한 주만 줄여도 체감이 큽니다.',
      action: '주 1회는 집이나 도서관에서 마시는 날로 정해보세요.',
    },
  ],
  교통: [
    {
      reason: '교통비는 정기적으로 나가서 놓치기 쉽습니다.',
      action: '알뜰교통카드, 정기권, 학생 할인 여부를 먼저 확인해보세요.',
    },
    {
      reason: '짧은 이동도 누적되면 큰 비용이 됩니다.',
      action: '도보나 자전거로 가능한 구간을 한 번 점검해보세요.',
    },
    {
      reason: '이동 경로를 고정하면 불필요한 지출이 줄어듭니다.',
      action: '자주 가는 경로는 대중교통 정기권 기준으로 비교해보세요.',
    },
  ],
  '구독/정기결제': [
    {
      reason: '정기 구독은 놓치기 쉬운 고정비입니다.',
      action: '학생 요금제와 가족/공유 요금제를 함께 비교해보세요.',
    },
    {
      reason: '사용하지 않는 구독은 가장 먼저 정리할 수 있습니다.',
      action: '최근 30일 동안 사용하지 않은 구독을 해지해보세요.',
    },
    {
      reason: '정기결제는 중복 가입이 생기기 쉽습니다.',
      action: '결제일과 서비스명을 적어두고 중복 구독을 확인해보세요.',
    },
  ],
  교육: [
    {
      reason: '교재와 학습 자료는 계획 없이 사면 금액이 커집니다.',
      action: '중고서점, 전자책, 도서관 대여를 먼저 확인해보세요.',
    },
    {
      reason: '시험 기간에는 자료를 여러 번 사는 일이 생깁니다.',
      action: '필요한 교재만 남기고 중복 구매를 줄여보세요.',
    },
    {
      reason: '학습 도구는 공동 활용이 가능한 경우가 많습니다.',
      action: '학과 선배나 스터디 그룹의 대여 가능 여부를 확인해보세요.',
    },
  ],
  쇼핑: [
    {
      reason: '쇼핑은 충동구매가 가장 쉽게 생기는 항목입니다.',
      action: '구매 전 24시간 보류 규칙을 한 번 써보세요.',
    },
    {
      reason: '할인 정보가 있어도 필요한 물건인지 먼저 봐야 합니다.',
      action: '장바구니에 넣고 다음 날 다시 구매 여부를 확인해보세요.',
    },
    {
      reason: '소액 쇼핑이 반복되면 월말에 체감이 커집니다.',
      action: '이번 달 쇼핑 예산을 별도로 한 번 정해보세요.',
    },
  ],
  '문화/여가': [
    {
      reason: '문화/여가 지출은 즐겁지만 한 번 늘면 줄이기 어렵습니다.',
      action: '교내 행사, 무료 전시, 지역 문화 할인부터 확인해보세요.',
    },
    {
      reason: '주말마다 나가는 비용이 누적되기 쉽습니다.',
      action: '월 1~2회는 무료 활동으로 대체해보세요.',
    },
    {
      reason: '친구와의 약속 비용이 반복되면 예산이 흔들립니다.',
      action: '식비와 문화/여가 예산을 따로 나눠서 써보세요.',
    },
  ],
  '의료/건강': [
    {
      reason: '의료/건강 지출은 급하게 나가서 비교하기 어렵습니다.',
      action: '학교 보건소, 학생 할인, 건강보험 혜택을 먼저 확인해보세요.',
    },
    {
      reason: '정기적인 건강 관리가 비상 지출을 줄일 수 있습니다.',
      action: '소액이라도 예방 중심으로 점검해보세요.',
    },
  ],
  '주거/통신': [
    {
      reason: '주거/통신비는 한 번 조정하면 고정비 절감 효과가 큽니다.',
      action: '통신 요금제와 인터넷 결합할인을 다시 확인해보세요.',
    },
    {
      reason: '중복 청구나 불필요한 부가서비스가 숨어 있을 수 있습니다.',
      action: '요금 청구서를 보고 사용하지 않는 옵션을 정리해보세요.',
    },
  ],
  '금융/보험': [
    {
      reason: '금융/보험은 중복 가입이나 수수료가 놓치기 쉽습니다.',
      action: '중복 보험, 자동이체 수수료, 카드 혜택을 다시 점검해보세요.',
    },
    {
      reason: '작은 수수료도 반복되면 누적 부담이 됩니다.',
      action: '자주 쓰는 계좌와 카드의 혜택을 비교해보세요.',
    },
  ],
  '경조사/선물': [
    {
      reason: '경조사/선물은 예측하기 어렵지만 계획은 가능했습니다.',
      action: '월별 선물 예산을 따로 분리해두세요.',
    },
    {
      reason: '선물 비용이 커지기 전에 기준을 정해두는 게 좋습니다.',
      action: '금액 상한선을 정하고 그 안에서 준비해보세요.',
    },
  ],
  '반려동물': [
    {
      reason: '반려동물 지출은 반복 비용이 많아 체계적으로 관리해야 합니다.',
      action: '사료와 소모품은 정기구매와 공동구매를 비교해보세요.',
    },
    {
      reason: '소모품 가격 차이가 누적되면 예산에 영향을 줍니다.',
      action: '동일 제품의 최저가 알림을 활용해보세요.',
    },
  ],
  '뷰티/미용': [
    {
      reason: '뷰티/미용은 주기적 지출로 이어지기 쉽습니다.',
      action: '쿠폰, 멤버십, 셀프 관리 루틴을 같이 비교해보세요.',
    },
    {
      reason: '정기 관리와 이벤트성 소비를 구분하면 줄이기 쉽습니다.',
      action: '꼭 필요한 항목만 월별로 남겨보세요.',
    },
  ],
  생활: [
    {
      reason: '생활비는 작은 지출이 여러 번 쌓이는 형태입니다.',
      action: '공유 물품이나 정기구매로 바꿀 수 있는 항목을 찾아보세요.',
    },
    {
      reason: '매번 사는 소모품이 있다면 묶음 구매가 도움이 됩니다.',
      action: '이번 달 생활비 항목을 한 번 묶어서 살펴보세요.',
    },
  ],
  기타: [
    {
      reason: '분류되지 않은 지출이 있으면 소비 패턴 파악이 어려워집니다.',
      action: '미분류 항목부터 다시 카테고리로 정리해보세요.',
    },
    {
      reason: '큰 지출이 아니라도 반복되면 예산을 흔듭니다.',
      action: '이번 주 지출 중 반복되는 항목이 있는지 확인해보세요.',
    },
  ],
  미분류: [
    {
      reason: '미분류 지출이 많으면 분석 정확도가 떨어집니다.',
      action: '미분류 항목부터 카테고리를 다시 지정해보세요.',
    },
    {
      reason: '어디에 쓰는지 모르는 지출부터 정리해야 절약이 쉬워집니다.',
      action: '영수증이나 메모를 보고 실제 용도를 확인해보세요.',
    },
  ],
};

const STUDENT_SAVINGS_TIP_ALIASES = {
  구독: '구독/정기결제',
  도서: '교육',
  교재: '교육',
  책: '교육',
  외식: '식비',
  점심: '식비',
  저녁: '식비',
  커피: '카페',
};

const DEFAULT_STUDENT_SAVINGS_TIPS = [
  {
    category: '전체',
    title: '기록을 더 쌓아보세요',
    reason: '분석할 지출 기록이 더 필요합니다.',
    action: '이번 주 지출을 계속 카테고리별로 기록해보세요.',
  },
  {
    category: '전체',
    title: '큰 지출부터 점검해보세요',
    reason: '월 예산은 상위 지출에서 먼저 흔들립니다.',
    action: '상위 지출 카테고리 1개만 먼저 줄여보세요.',
  },
  {
    category: '전체',
    title: '예산 메모를 남겨보세요',
    reason: '지출 이유를 적으면 반복 소비를 찾기 쉽습니다.',
    action: '지출할 때 간단한 메모를 함께 남겨보세요.',
  },
];

function normalizeTipCategory(category) {
  const rawCategory = String(category || '').trim();
  return STUDENT_SAVINGS_TIP_ALIASES[rawCategory] || rawCategory || '기타';
}

function getTipLibrary(category) {
  return STUDENT_SAVINGS_TIP_LIBRARY[category] || STUDENT_SAVINGS_TIP_LIBRARY.기타;
}

function buildTipCard(category, title, reason, action) {
  return {
    category,
    title,
    reason,
    action,
  };
}

export function getStudentSavingsTips(categorySummary = {}, monthlyComparison = {}) {
  const recordsCount = categorySummary?.recordsCount || 0;
  const monthlyTotal = categorySummary?.monthlyTotal || 0;
  const topCategory = categorySummary?.topCategory || {
    category: '기타',
    amount: 0,
    ratio: 0,
  };
  const biggestIncreaseCategory = monthlyComparison?.biggestIncreaseCategory || null;

  if (recordsCount === 0 || monthlyTotal === 0) {
    return DEFAULT_STUDENT_SAVINGS_TIPS;
  }

  const tipTargets = [];

  if (topCategory.amount > 0) {
    tipTargets.push({
      category: topCategory.category,
      label: '이번 달 가장 큰 지출',
      reason: `${topCategory.category}가 전체 지출의 ${topCategory.ratio}%를 차지합니다.`,
      action: getTipLibrary(normalizeTipCategory(topCategory.category))[0].action,
      priority: topCategory.ratio >= 40 ? 0 : 1,
    });
  }

  if (biggestIncreaseCategory && biggestIncreaseCategory.changeAmount > 0) {
    tipTargets.push({
      category: biggestIncreaseCategory.category,
      label: '지난달보다 늘어난 지출',
      reason: `${biggestIncreaseCategory.category} 지출이 지난달보다 ${biggestIncreaseCategory.changeAmount.toLocaleString('ko-KR')}원 늘었습니다.`,
      action: getTipLibrary(normalizeTipCategory(biggestIncreaseCategory.category))[0].action,
      priority: 1,
    });
  }

  if (tipTargets.length === 0) {
    return DEFAULT_STUDENT_SAVINGS_TIPS;
  }

  const selectedTips = [];
  const tipUsageCount = new Map();

  const orderedTargets = tipTargets.sort((left, right) => left.priority - right.priority);

  orderedTargets.forEach((target) => {
    const normalizedCategory = normalizeTipCategory(target.category);
    const library = getTipLibrary(normalizedCategory);
    const usageCount = tipUsageCount.get(normalizedCategory) || 0;
    const libraryIndex = Math.min(usageCount, library.length - 1);
    const tip = library[libraryIndex];

    tipUsageCount.set(normalizedCategory, usageCount + 1);
    selectedTips.push(
      buildTipCard(
        target.category,
        `${target.category} 맞춤 팁`,
        target.reason,
        tip.action
      )
    );
  });

  if (selectedTips.length < 3) {
    DEFAULT_STUDENT_SAVINGS_TIPS.forEach((tip) => {
      if (selectedTips.length >= 3) {
        return;
      }

      selectedTips.push(tip);
    });
  }

  return selectedTips.slice(0, 3);
}
