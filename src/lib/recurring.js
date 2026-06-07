function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDayKey(date) {
  return new Date(date).getDate();
}

function getMonthKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

export function applyRecurringExpenses(records = [], recurringExpenses = [], date = new Date()) {
  const targetDay = getDayKey(date);
  const currentMonthKey = getMonthKey(date);
  const nextRecords = [...records];

  recurringExpenses.forEach((item) => {
    const paymentDay = toNumber(item.paymentDay);
    if (!paymentDay || paymentDay !== targetDay) {
      return;
    }

    const alreadyApplied = nextRecords.some(
      (record) => record.sourceRecurringId === item.id && record.monthKey === currentMonthKey
    );

    if (alreadyApplied) {
      return;
    }

    nextRecords.unshift({
      id: crypto.randomUUID(),
      sourceRecurringId: item.id,
      monthKey: currentMonthKey,
      date: new Date(date).toISOString(),
      amount: toNumber(item.amount),
      category: item.category || '고정지출',
      paymentMethod: item.paymentMethod || '카드',
      type: '정기지출',
      memo: item.memo || '',
      title: item.name || '정기지출',
    });
  });

  return nextRecords;
}
