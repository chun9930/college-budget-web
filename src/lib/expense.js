function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMonthKey(value) {
  const normalizedValue = normalizeText(value);

  if (!/^\d{4}-\d{2}/.test(normalizedValue)) {
    return '';
  }

  return normalizedValue.slice(0, 7);
}

function formatMonthLabel(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return '기타';
  }

  const [year, month] = monthKey.split('-');
  return `${Number(year)}년 ${Number(month)}월`;
}

function formatDate(value) {
  const current = new Date(value || new Date());

  if (Number.isNaN(current.getTime())) {
    return '';
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeRecordType(recordType) {
  const normalizedType = normalizeText(recordType);

  if (normalizedType === '고정지출' || normalizedType === '정기지출') {
    return normalizedType;
  }

  return '일반지출';
}

export function isValidExpenseAmount(amount) {
  return Number.isFinite(Number(amount)) && Number(amount) > 0;
}

export function createExpenseRecord({
  amount,
  category,
  date,
  memo = '',
  paymentMethod = '카드',
  expenseType = '일반지출',
}) {
  return {
    id: Date.now(),
    amount: Number(amount),
    category: normalizeText(category) || '기타',
    date: formatDate(date),
    memo: normalizeText(memo),
    paymentMethod: normalizeText(paymentMethod) || '카드',
    expenseType: normalizeRecordType(expenseType),
  };
}

export function createExpenseTemplate({
  name,
  amount,
  category,
  memo = '',
  paymentMethod = '카드',
  expenseType = '일반지출',
}) {
  return {
    id: Date.now(),
    name: normalizeText(name) || `${normalizeText(category) || '기타'} 템플릿`,
    amount: Number(amount),
    category: normalizeText(category) || '기타',
    memo: normalizeText(memo),
    paymentMethod: normalizeText(paymentMethod) || '카드',
    expenseType: normalizeRecordType(expenseType),
  };
}

export function summarizeRecordsByField(records = [], fieldName, order = []) {
  const summaryMap = new Map();

  for (const record of records) {
    const amount = Number(record?.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    const rawValue = normalizeText(record?.[fieldName]) || '기타';
    const previous = summaryMap.get(rawValue) ?? { label: rawValue, amount: 0, recordCount: 0 };

    summaryMap.set(rawValue, {
      label: rawValue,
      amount: previous.amount + amount,
      recordCount: previous.recordCount + 1,
    });
  }

  const orderedItems = [];

  for (const item of order) {
    if (summaryMap.has(item)) {
      orderedItems.push(summaryMap.get(item));
      summaryMap.delete(item);
    }
  }

  orderedItems.push(...Array.from(summaryMap.values()));

  const totalAmount = orderedItems.reduce((total, item) => total + item.amount, 0);

  return {
    totalAmount,
    recordCount: records.length,
    items: orderedItems.map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    })),
  };
}

export function summarizeExpenseRecords(records = [], categoryOrder = []) {
  return summarizeRecordsByField(records, 'category', categoryOrder);
}

export function summarizeRecordsByMonth(records = [], monthCount = 3, date = new Date()) {
  const currentDate = new Date(date);

  if (Number.isNaN(currentDate.getTime()) || monthCount <= 0) {
    return {
      totalAmount: 0,
      recordCount: 0,
      items: [],
    };
  }

  const monthKeys = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - offset, 1);
    monthKeys.push(
      `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`,
    );
  }

  const summaryMap = new Map(
    monthKeys.map((monthKey) => [
      monthKey,
      { label: formatMonthLabel(monthKey), monthKey, amount: 0, recordCount: 0 },
    ]),
  );

  for (const record of records) {
    const amount = Number(record?.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    const monthKey = normalizeMonthKey(record?.date);

    if (!summaryMap.has(monthKey)) {
      continue;
    }

    const previous = summaryMap.get(monthKey);
    summaryMap.set(monthKey, {
      ...previous,
      amount: previous.amount + amount,
      recordCount: previous.recordCount + 1,
    });
  }

  const items = monthKeys.map((monthKey) => summaryMap.get(monthKey));
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);

  return {
    totalAmount,
    recordCount: records.length,
    items: items.map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    })),
  };
}

function getCategoryAdvice(categoryLabel) {
  switch (categoryLabel) {
    case '식비':
      return '식비 비중이 높습니다. 주 1회 장보기와 간단한 도시락을 섞으면 줄이기 쉽습니다.';
    case '교통':
      return '교통비가 크다면 정기권이나 이동 동선을 한 번에 묶는 방법을 검토해 보세요.';
    case '생활':
      return '생활비는 작은 지출이 쌓이기 쉽습니다. 반복 결제를 먼저 점검해 보세요.';
    case '문화':
      return '문화비는 미리 상한선을 정해 두면 과소비를 막는 데 도움이 됩니다.';
    default:
      return '가장 큰 지출 항목부터 먼저 줄이면 체감 효과가 큽니다.';
  }
}

export function buildCategoryAnalysis(categorySummary = {}, threshold = 30) {
  const items = Array.isArray(categorySummary.items) ? categorySummary.items : [];
  const totalAmount = Number(categorySummary.totalAmount) || 0;
  const topCategory = items[0] ?? null;
  const overCategories = items.filter((item) => Number(item?.percentage) >= threshold);

  if (totalAmount <= 0 || items.length === 0) {
    return {
      hasRecords: false,
      title: '저장된 지출 기록이 없습니다.',
      message: '기록이 쌓이면 카테고리 초과와 절약 힌트를 보여줍니다.',
      topCategory: null,
      overCategories: [],
      advice: '지출을 몇 건만 저장해도 카테고리 분석이 더 정확해집니다.',
      isBalanced: true,
    };
  }

  const advice = getCategoryAdvice(topCategory?.label);
  const isBalanced = overCategories.length === 0;

  return {
    hasRecords: true,
    title: isBalanced ? '카테고리 분포가 비교적 고릅니다.' : '카테고리 초과가 감지되었습니다.',
    message: `${topCategory?.label || '기타'}가 전체 지출에서 가장 큰 비중을 차지합니다.`,
    topCategory,
    overCategories,
    advice,
    isBalanced,
  };
}

export function buildSavingHints(categoryAnalysis = {}) {
  if (!categoryAnalysis?.hasRecords) {
    return {
      title: '절약 힌트를 보려면 지출 기록이 필요합니다.',
      primary: '지출이 쌓이면 어느 항목부터 줄이면 좋은지 더 구체적으로 볼 수 있습니다.',
      secondary: '지금은 기록을 몇 건 더 쌓는 것이 가장 좋은 다음 단계입니다.',
    };
  }

  const topCategory = categoryAnalysis.topCategory?.label || '기타';
  const topPercentage = Number(categoryAnalysis.topCategory?.percentage) || 0;
  const overCategory = categoryAnalysis.overCategories[0];

  const primary = `${topCategory} 비중이 ${topPercentage.toFixed(1)}%입니다. 이 항목부터 먼저 줄여보면 체감 효과가 큽니다.`;
  const secondary = overCategory
    ? `${overCategory.label}는 ${overCategory.percentage.toFixed(1)}%로 높습니다. 해당 카테고리의 하루 상한선을 정해 보세요.`
    : `${categoryAnalysis.advice} 작은 지출을 하나만 줄여도 한 달 차이가 납니다.`;

  return {
    title: '절약 힌트',
    primary,
    secondary,
  };
}
