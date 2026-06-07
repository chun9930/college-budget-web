export const ALERT_LABELS = {
  safe: '안전',
  caution: '주의',
  danger: '위험',
  over: '초과',
};

export function getAlertState({ spent = 0, dailyBudget = 0 } = {}) {
  const budget = Number(dailyBudget);
  const used = Number(spent);

  if (!Number.isFinite(budget) || budget <= 0) {
    return used > 0
      ? { key: 'over', label: ALERT_LABELS.over, description: '예산이 없어 초과 상태로 봅니다.' }
      : { key: 'safe', label: ALERT_LABELS.safe, description: '예산을 입력하면 상태를 계산합니다.' };
  }

  const usageRate = used / budget;

  if (usageRate >= 1) {
    return {
      key: 'over',
      label: ALERT_LABELS.over,
      description: '오늘 예산을 초과했습니다.',
    };
  }

  if (usageRate >= 0.9) {
    return {
      key: 'danger',
      label: ALERT_LABELS.danger,
      description: '오늘 예산의 90% 이상을 사용했습니다.',
    };
  }

  if (usageRate >= 0.7) {
    return {
      key: 'caution',
      label: ALERT_LABELS.caution,
      description: '오늘 예산의 70% 이상을 사용했습니다.',
    };
  }

  return {
    key: 'safe',
    label: ALERT_LABELS.safe,
    description: '예산이 아직 여유롭습니다.',
  };
}

export function getHomeJudgmentSnapshot({
  hasBudgetSetup = false,
  alertState = {},
  dailyBudget = 0,
  todaySpent = 0,
} = {}) {
  const budget = Number(dailyBudget) || 0;
  const spent = Number(todaySpent) || 0;
  const spentRatio = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remainingAmount = Math.max(Math.round(budget - spent), 0);
  const exceededAmount = Math.max(Math.round(spent - budget), 0);

  if (!hasBudgetSetup) {
    return {
      statusKey: 'setup',
      statusLabel: '설정 필요',
      message: '예산 설정이 필요해요',
      description: '예산을 저장해야 오늘 사용 가능 금액을 정확하게 계산할 수 있어요.',
      relatedAmount: null,
    };
  }

  if (alertState.key === 'over') {
    return {
      statusKey: 'over',
      statusLabel: ALERT_LABELS.over,
      message: '오늘 예산을 초과했어요',
      description: '지금 소비는 권장되지 않습니다.',
      relatedAmount: exceededAmount,
    };
  }

  if (alertState.key === 'safe') {
    return {
      statusKey: 'safe',
      statusLabel: ALERT_LABELS.safe,
      message: `오늘 ${remainingAmount.toLocaleString()}원 더 쓸 수 있어요`,
      description: '지금은 여유가 있어요. 필요한 지출만 먼저 입력해 보세요.',
      relatedAmount: remainingAmount,
    };
  }

  if (alertState.key === 'danger') {
    return {
      statusKey: 'danger',
      statusLabel: ALERT_LABELS.danger,
      message: '오늘 예산이 거의 다 찼어요',
      description: '오늘 예산이 거의 다 찼어요. 꼭 필요한 지출인지 확인해 주세요.',
      relatedAmount: spent,
    };
  }

  return {
    statusKey: alertState.key || 'caution',
    statusLabel: alertState.label || ALERT_LABELS.caution,
    message: '오늘 예산이 빠듯해요',
    description: '남은 예산이 많지 않아요. 추가 소비는 조심해 주세요.',
    relatedAmount: spent,
  };
}

export function getExpensePreviewSnapshot({
  hasBudgetSetup = false,
  dailyBudget = 0,
  todaySpent = 0,
  inputAmount = '',
} = {}) {
  const budget = Number(dailyBudget) || 0;
  const spent = Number(todaySpent) || 0;
  const rawInput = String(inputAmount ?? '').trim();

  if (!hasBudgetSetup || budget <= 0) {
    return {
      statusKey: 'setup',
      statusLabel: '설정 필요',
      message: '예산 설정이 필요해요',
      description: '예산을 저장해야 지출 가능 여부를 정확하게 판단할 수 있어요.',
      relatedAmount: null,
    };
  }

  if (!rawInput) {
    return {
      statusKey: 'idle',
      statusLabel: '입력 대기',
      message: '금액을 입력하면 저장 전 판단을 보여드립니다',
      description: '입력한 금액 기준으로 오늘 예산과 비교합니다.',
      relatedAmount: null,
    };
  }

  const amount = Number(rawInput);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      statusKey: 'idle',
      statusLabel: '입력 대기',
      message: '금액을 입력하면 저장 전 판단을 보여드립니다',
      description: '입력한 금액 기준으로 오늘 예산과 비교합니다.',
      relatedAmount: null,
    };
  }

  const projectedSpent = spent + amount;
  const usageRate = budget > 0 ? projectedSpent / budget : 0;
  const remainingAfterSpend = Math.max(Math.round(budget - projectedSpent), 0);
  const exceededAmount = Math.max(Math.round(projectedSpent - budget), 0);

  if (usageRate >= 1) {
    return {
      statusKey: 'over',
      statusLabel: ALERT_LABELS.over,
      message: '이 지출을 추가하면 오늘 예산을 초과합니다',
      description: '지금 소비는 권장되지 않습니다.',
      relatedAmount: exceededAmount,
    };
  }

  if (usageRate >= 0.9) {
    return {
      statusKey: 'danger',
      statusLabel: ALERT_LABELS.danger,
      message: '이 지출을 추가하면 오늘 예산의 90%를 사용하게 돼요',
      description: '조금만 더 쓰면 초과할 수 있어요.',
      relatedAmount: Math.max(Math.round(budget - projectedSpent), 0),
    };
  }

  if (usageRate >= 0.7) {
    return {
      statusKey: 'caution',
      statusLabel: ALERT_LABELS.caution,
      message: '이 지출을 추가하면 오늘 예산의 70%를 넘겨요',
      description: '추가 소비는 한 번 더 확인해 주세요.',
      relatedAmount: Math.max(Math.round(budget - projectedSpent), 0),
    };
  }

  return {
    statusKey: 'safe',
    statusLabel: ALERT_LABELS.safe,
    message: `이 지출을 추가하면 오늘 ${remainingAfterSpend.toLocaleString()}원을 더 쓸 수 있어요`,
    description: '지금은 여유가 있어요. 필요한 지출만 먼저 입력해 보세요.',
    relatedAmount: remainingAfterSpend,
  };
}

export function getMonthlyJudgmentSnapshot({
  hasBudgetSetup = false,
  monthlyBudget = 0,
  monthSpent = 0,
} = {}) {
  const budget = Number(monthlyBudget) || 0;
  const spent = Number(monthSpent) || 0;
  const alertState = getAlertState({ spent, dailyBudget: budget });
  const spentRatio = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remainingAmount = Math.max(Math.round(budget - spent), 0);
  const exceededAmount = Math.max(Math.round(spent - budget), 0);

  if (!hasBudgetSetup) {
    return {
      statusKey: 'setup',
      statusLabel: '설정 필요',
      message: '예산 설정이 필요해요',
      description: '예산을 저장해야 이번 달 사용 가능 금액을 정확하게 계산할 수 있어요.',
      relatedAmount: null,
    };
  }

  if (alertState.key === 'over') {
    return {
      statusKey: 'over',
      statusLabel: ALERT_LABELS.over,
      message: '이번 달 예산을 초과했어요',
      description: '이번 달 소비는 한 번 더 확인해 주세요.',
      relatedAmount: exceededAmount,
    };
  }

  if (alertState.key === 'safe') {
    return {
      statusKey: 'safe',
      statusLabel: ALERT_LABELS.safe,
      message: `이번 달 ${remainingAmount.toLocaleString()}원 더 쓸 수 있어요`,
      description: '이번 달 예산이 아직 여유가 있어요.',
      relatedAmount: remainingAmount,
    };
  }

  return {
    statusKey: alertState.key || 'caution',
    statusLabel: alertState.label || ALERT_LABELS.caution,
    message: `이번 달 예산의 ${spentRatio}%를 사용했어요`,
    description: '이번 달 소비가 빠르게 늘고 있어요.',
    relatedAmount: spent,
  };
}
