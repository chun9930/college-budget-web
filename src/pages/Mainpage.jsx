import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calculateBudgetPlan,
  formatKoreanWon,
  judgeSpending,
  parseMoneyInput,
} from '../lib/budget.js';
import { getBudgetSettings, getExpenseRecords, getMonthlyIncome } from '../lib/storage.js';

function Mainpage() {
  const monthlyIncome = getMonthlyIncome();
  const budgetSettings = getBudgetSettings();
  const expenseRecords = getExpenseRecords();
  const budgetPlan = calculateBudgetPlan({ monthlyIncome, budgetSettings, expenseRecords });

  const [spendingAmountInput, setSpendingAmountInput] = useState('');
  const [judgment, setJudgment] = useState(null);

  function handleSpendingSubmit(event) {
    event.preventDefault();

    const parsedSpendingAmount = parseMoneyInput(spendingAmountInput);
    const result = judgeSpending({
      spendingAmount: parsedSpendingAmount,
      dailyBudget: budgetPlan.availableDailyBudget,
    });

    setJudgment(result);
  }

  function handleSpendingChange(event) {
    setSpendingAmountInput(event.target.value);
    setJudgment(null);
  }

  function getJudgmentTone(status) {
    if (status === 'over' || status === 'invalid') {
      return 'message-box--error';
    }

    if (status === 'warning') {
      return 'message-box--warning';
    }

    if (status === 'watch') {
      return 'message-box--watch';
    }

    return 'message-box--stable';
  }

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">실시간 예산 판단</p>
        <h2>오늘 이 소비를 해도 되는지 바로 확인하세요</h2>
        <p className="section-lead">
          예산 설정은 별도 화면에서 관리하고, 여기서는 현재 사용 가능한 금액 기준으로
          지출 가능 여부만 빠르게 판단합니다.
        </p>
      </header>

      <div className="summary-grid">
        <article className="summary-card summary-card--accent">
          <span>현재 사용 가능 금액</span>
          <strong>{formatKoreanWon(budgetPlan.availableDailyBudget)}</strong>
        </article>
        <article className="summary-card">
          <span>현재 경고 단계</span>
          <strong>{budgetPlan.spendingStage.title}</strong>
        </article>
        <article className="summary-card">
          <span>오늘 기본 예산</span>
          <strong>{formatKoreanWon(budgetPlan.baseDailyBudget)}</strong>
        </article>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>실시간 소비 판단</h3>
            <p>지출 금액을 입력하고 판정하기를 누르면 결과가 아래 카드에 표시됩니다.</p>
          </div>

          <form className="budget-form" onSubmit={handleSpendingSubmit} noValidate>
            <label htmlFor="spending-amount">지출 금액</label>
            <input
              id="spending-amount"
              type="text"
              inputMode="numeric"
              placeholder="예: 12000"
              value={spendingAmountInput}
              onChange={handleSpendingChange}
            />
            <button type="submit">판정하기</button>
          </form>

          {judgment ? (
            <div className={`message-box ${getJudgmentTone(judgment.status)}`}>
              <strong>{judgment.title}</strong>
              <p>{judgment.message}</p>
              {judgment.usageRate !== undefined ? (
                <p>사용 비율: {(judgment.usageRate * 100).toFixed(0)}%</p>
              ) : null}
              {judgment.remainingBudget !== undefined ? (
                <p>남은 금액: {formatKoreanWon(judgment.remainingBudget)}</p>
              ) : null}
              {judgment.warning ? <p>{judgment.warning}</p> : null}
            </div>
          ) : (
            <p className="message-box message-box--hint">
              지출 금액을 입력한 뒤 판정하기를 누르면 결과가 표시됩니다.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>현재 예산 규칙</h3>
            <p>설정 화면에서 저장한 규칙이 지금 소비 판단에 반영됩니다.</p>
          </div>

          <dl className="summary-list">
            <div>
              <dt>예산 방식</dt>
              <dd>{budgetPlan.isManualBudgetActive ? '수동 예산 적용' : '자동 계산'}</dd>
            </div>
            <div>
              <dt>이월 상태</dt>
              <dd>{budgetPlan.carryOverEnabled ? '사용 중' : '사용 안 함'}</dd>
            </div>
            <div>
              <dt>오늘 반영된 이월</dt>
              <dd>{formatKoreanWon(budgetPlan.carryOverAmount)}</dd>
            </div>
            <div>
              <dt>오늘 사용한 지출</dt>
              <dd>{formatKoreanWon(budgetPlan.spentToday)}</dd>
            </div>
            <div>
              <dt>목표 저축액</dt>
              <dd>{formatKoreanWon(budgetPlan.savingGoalAmount)}</dd>
            </div>
            <div>
              <dt>비상금 제외</dt>
              <dd>{formatKoreanWon(budgetPlan.emergencyFundAmount)}</dd>
            </div>
          </dl>

          <p className="message-box message-box--hint">
            판정 기준은 오늘 최종 사용 가능 금액의 비율입니다. 안정은 50% 미만, 주의는 50%
            이상 75% 미만, 경고는 75% 이상 100% 미만, 초과는 100% 이상입니다.
          </p>
        </section>
      </div>

      <Link className="section-link" to="/budget-status">
        예산 상태 / 설정 보기
      </Link>
    </section>
  );
}

export default Mainpage;
