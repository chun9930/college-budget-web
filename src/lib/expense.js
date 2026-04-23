export function isValidExpenseAmount(amount) {
  return Number.isFinite(Number(amount)) && Number(amount) > 0;
}

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

export function createExpenseRecord({ amount, category, date, memo = '' }) {
  return {
    id: Date.now(),
    amount: Number(amount),
    category: normalizeText(category) || '기타',
    date: formatDate(date),
    memo: normalizeText(memo),
  };
}

export function summarizeExpenseRecords(records = [], categoryOrder = []) {
  const summaryMap = new Map();

  for (const record of records) {
    const amount = Number(record?.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    const category = normalizeText(record?.category) || '기타';
    const previous = summaryMap.get(category) ?? { category, amount: 0, recordCount: 0 };

    summaryMap.set(category, {
      category,
      amount: previous.amount + amount,
      recordCount: previous.recordCount + 1,
    });
  }

  const orderedCategories = [];

  for (const category of categoryOrder) {
    if (summaryMap.has(category)) {
      orderedCategories.push(summaryMap.get(category));
      summaryMap.delete(category);
    }
  }

  orderedCategories.push(...Array.from(summaryMap.values()));

  const totalAmount = orderedCategories.reduce((total, item) => total + item.amount, 0);
  const categories = orderedCategories.map((item) => ({
    ...item,
    percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
  }));

  return {
    totalAmount,
    recordCount: records.length,
    categories,
  };
}
