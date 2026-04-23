function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
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
