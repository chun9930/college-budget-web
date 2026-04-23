import { useState } from 'react';
import {
  calculateBudgetPlan,
  formatKoreanWon,
  getRemainingDaysInMonth,
  parseMoneyInput,
} from '../lib/budget.js';
import {
  getBudgetAmount,
  getBudgetSettings,
  getMonthlyIncome,
  setBudgetAmount,
  setBudgetSettings,
  setMonthlyIncome,
} from '../lib/storage.js';

function parseOptionalMoneyInput(value) {
  const trimmedValue = String(value).trim();

  if (trimmedValue === '') {
    return 0;
  }

  return parseMoneyInput(trimmedValue);
}

function BudgetStatus() {
  const savedMonthlyIncome = getMonthlyIncome();
  const savedBudgetSettings = getBudgetSettings();
  const savedBudgetAmount = getBudgetAmount();
  const [displayMonthlyIncome, setDisplayMonthlyIncome] = useState(savedMonthlyIncome);
  const [displayBudgetSettings, setDisplayBudgetSettings] = useState(savedBudgetSettings);
  const [displayBudgetAmount, setDisplayBudgetAmount] = useState(savedBudgetAmount);

  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState(
    savedMonthlyIncome > 0 ? String(savedMonthlyIncome) : '',
  );
  const [manualDailyBudgetInput, setManualDailyBudgetInput] = useState(
    savedBudgetSettings.manualDailyBudget > 0 ? String(savedBudgetSettings.manualDailyBudget) : '',
  );
  const [carryOverEnabled, setCarryOverEnabled] = useState(savedBudgetSettings.carryOverEnabled);
  const [carryOverAmountInput, setCarryOverAmountInput] = useState(
    savedBudgetSettings.carryOverAmount > 0 ? String(savedBudgetSettings.carryOverAmount) : '',
  );
  const [savingGoalAmountInput, setSavingGoalAmountInput] = useState(
    savedBudgetSettings.savingGoalAmount > 0 ? String(savedBudgetSettings.savingGoalAmount) : '',
  );
  const [emergencyFundAmountInput, setEmergencyFundAmountInput] = useState(
    savedBudgetSettings.emergencyFundAmount > 0 ? String(savedBudgetSettings.emergencyFundAmount) : '',
  );
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('success');

  const currentPlan = calculateBudgetPlan({
    monthlyIncome: displayMonthlyIncome,
    budgetSettings: displayBudgetSettings,
  });

  function handleSubmit(event) {
    event.preventDefault();

    if (monthlyIncomeInput.trim() === '') {
      setMessage('월 수입을 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    const parsedMonthlyIncome = parseMoneyInput(monthlyIncomeInput);
    if (parsedMonthlyIncome === null) {
      setMessage('월 수입은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    if (parsedMonthlyIncome <= 0) {
      setMessage('월 수입은 0보다 큰 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    let parsedManualDailyBudget = 0;
    if (manualDailyBudgetInput.trim() !== '') {
      parsedManualDailyBudget = parseMoneyInput(manualDailyBudgetInput);

      if (parsedManualDailyBudget === null) {
        setMessage('수동 하루 예산은 숫자로 입력해 주세요.');
        setMessageTone('error');
        return;
      }

      if (parsedManualDailyBudget <= 0) {
        setMessage('수동 하루 예산은 0보다 큰 숫자로 입력해 주세요.');
        setMessageTone('error');
        return;
      }
    }

    const parsedCarryOverAmount = carryOverEnabled ? parseOptionalMoneyInput(carryOverAmountInput) : 0;
    if (parsedCarryOverAmount === null) {
      setMessage('남은 금액 이관 금액은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    const parsedSavingGoalAmount = parseOptionalMoneyInput(savingGoalAmountInput);
    if (parsedSavingGoalAmount === null) {
      setMessage('목표 저축액은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    const parsedEmergencyFundAmount = parseOptionalMoneyInput(emergencyFundAmountInput);
    if (parsedEmergencyFundAmount === null) {
      setMessage('비상금 제외 금액은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    const nextBudgetSettings = {
      manualDailyBudget: parsedManualDailyBudget || 0,
      carryOverEnabled,
      carryOverAmount: carryOverEnabled ? parsedCarryOverAmount : 0,
      savingGoalAmount: parsedSavingGoalAmount || 0,
      emergencyFundAmount: parsedEmergencyFundAmount || 0,
    };
    const nextPlan = calculateBudgetPlan({
      monthlyIncome: parsedMonthlyIncome,
      budgetSettings: nextBudgetSettings,
    });

    setMonthlyIncome(parsedMonthlyIncome);
    setBudgetSettings(nextBudgetSettings);
    setBudgetAmount(nextPlan.availableDailyBudget);
    setDisplayMonthlyIncome(parsedMonthlyIncome);
    setDisplayBudgetSettings(nextBudgetSettings);
    setDisplayBudgetAmount(nextPlan.availableDailyBudget);
    setMessage('예산 설정이 저장되었습니다.');
    setMessageTone('success');
  }

  function handleCarryOverChange(event) {
    const nextEnabled = event.target.checked;
    setCarryOverEnabled(nextEnabled);

    if (!nextEnabled) {
      setCarryOverAmountInput('');
    }
  }

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">예산 상태 / 설정</p>
        <h2>월 수입과 예산 규칙을 한 곳에서 관리하세요</h2>
        <p className="section-lead">
          이 화면에서 월 수입, 수동 예산, 남은 금액 이관, 목표 저축, 비상금 제외를 함께
          저장하고, 저장된 값은 바로 소비 판단에 반영됩니다.
        </p>
      </header>

      <div className="summary-grid">
        <article className="summary-card summary-card--accent">
          <span>저장된 월 수입</span>
          <strong>{formatKoreanWon(displayMonthlyIncome)}</strong>
        </article>
        <article className="summary-card">
          <span>현재 사용 가능 금액</span>
          <strong>{formatKoreanWon(displayBudgetAmount || currentPlan.availableDailyBudget)}</strong>
        </article>
        <article className="summary-card">
          <span>이번 달 남은 일수</span>
          <strong>{getRemainingDaysInMonth()}일</strong>
        </article>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>예산 설정</h3>
            <p>월 수입을 기준으로 하루 예산을 계산하고, 필요하면 직접 덮어쓸 수 있습니다.</p>
          </div>

          <form className="budget-form budget-form--stacked" onSubmit={handleSubmit} noValidate>
            <div className="form-block">
              <label htmlFor="monthly-income">월 수입</label>
              <input
                id="monthly-income"
                type="text"
                inputMode="numeric"
                value={monthlyIncomeInput}
                onChange={(event) => setMonthlyIncomeInput(event.target.value)}
                placeholder="예: 1000000"
              />
            </div>

            <div className="form-block">
              <label htmlFor="manual-daily-budget">수동 하루 예산</label>
              <input
                id="manual-daily-budget"
                type="text"
                inputMode="numeric"
                value={manualDailyBudgetInput}
                onChange={(event) => setManualDailyBudgetInput(event.target.value)}
                placeholder="비우면 자동 계산"
              />
              <p className="field-note">값을 입력하면 자동 계산보다 이 값이 우선됩니다.</p>
            </div>

            <div className="form-block">
              <label className="toggle-row" htmlFor="carry-over-enabled">
                <input
                  id="carry-over-enabled"
                  type="checkbox"
                  checked={carryOverEnabled}
                  onChange={handleCarryOverChange}
                />
                남은 금액 이관 사용
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={carryOverAmountInput}
                onChange={(event) => setCarryOverAmountInput(event.target.value)}
                placeholder="예: 5000"
                disabled={!carryOverEnabled}
              />
              <p className="field-note">이관 금액은 다음 날 사용 가능 금액에 더해집니다.</p>
            </div>

            <div className="form-block form-block--two-up">
              <div>
                <label htmlFor="saving-goal-amount">목표 저축액</label>
                <input
                  id="saving-goal-amount"
                  type="text"
                  inputMode="numeric"
                  value={savingGoalAmountInput}
                  onChange={(event) => setSavingGoalAmountInput(event.target.value)}
                  placeholder="예: 150000"
                />
              </div>

              <div>
                <label htmlFor="emergency-fund-amount">비상금 제외 금액</label>
                <input
                  id="emergency-fund-amount"
                  type="text"
                  inputMode="numeric"
                  value={emergencyFundAmountInput}
                  onChange={(event) => setEmergencyFundAmountInput(event.target.value)}
                  placeholder="예: 200000"
                />
              </div>
            </div>

            <button type="submit">예산 저장</button>
          </form>

          {message ? (
            <p className={`message-box message-box--${messageTone}`}>{message}</p>
          ) : (
            <p className="message-box message-box--hint">
              저장하면 현재 소비 판단과 예산 상태 화면에 같은 규칙이 반영됩니다.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>현재 계산 결과</h3>
            <p>저장된 규칙을 기준으로 오늘 사용 가능한 금액을 계산합니다.</p>
          </div>

          <dl className="summary-list">
            <div>
              <dt>자동 계산 하루 예산</dt>
              <dd>{formatKoreanWon(currentPlan.autoDailyBudget)}</dd>
            </div>
            <div>
              <dt>수동 하루 예산</dt>
              <dd>{formatKoreanWon(currentPlan.manualDailyBudget)}</dd>
            </div>
            <div>
              <dt>남은 금액 이관</dt>
              <dd>
                {currentPlan.carryOverEnabled
                  ? `${formatKoreanWon(currentPlan.carryOverAmount)} 반영`
                  : '사용 안 함'}
              </dd>
            </div>
            <div>
              <dt>목표 저축액</dt>
              <dd>{formatKoreanWon(currentPlan.savingGoalAmount)}</dd>
            </div>
            <div>
              <dt>비상금 제외</dt>
              <dd>{formatKoreanWon(currentPlan.emergencyFundAmount)}</dd>
            </div>
            <div>
              <dt>최종 사용 가능 금액</dt>
              <dd>{formatKoreanWon(currentPlan.availableDailyBudget)}</dd>
            </div>
          </dl>

          <p className="message-box message-box--hint">
            자동 계산은 월 수입에서 목표 저축액과 비상금을 먼저 제외한 뒤 남은 금액을 남은
            일수로 나눠 계산합니다. 수동 하루 예산이 있으면 그 값이 우선됩니다.
          </p>
        </section>
      </div>
    </section>
  );
}

export default BudgetStatus;
