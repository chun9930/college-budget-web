import { formatKoreanWon, getRemainingDaysInMonth } from '../lib/budget.js';
import { getBudgetAmount, getMonthlyIncome } from '../lib/storage.js';

function BudgetStatus() {
  const monthlyIncome = getMonthlyIncome();
  const budgetAmount = getBudgetAmount();

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">예산 상태</p>
        <h2>지금 저장된 예산 정보를 한눈에 확인하세요</h2>
        <p className="section-lead">
          메인 페이지에서 입력한 월 수입과 계산된 하루 예산, 남은 일수를 같이 보여줍니다.
        </p>
      </header>

      <div className="summary-grid">
        <article className="summary-card summary-card--accent">
          <span>월 수입</span>
          <strong>{formatKoreanWon(monthlyIncome)}</strong>
        </article>
        <article className="summary-card">
          <span>하루 예산</span>
          <strong>{formatKoreanWon(budgetAmount)}</strong>
        </article>
        <article className="summary-card">
          <span>이번 달 남은 일수</span>
          <strong>{getRemainingDaysInMonth()}일</strong>
        </article>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>현재 예산 요약</h3>
          <p>지금 단계에서는 수입을 다시 저장하면 하루 예산도 함께 갱신됩니다.</p>
        </div>

        <dl className="summary-list">
          <div>
            <dt>저장된 월 수입</dt>
            <dd>{formatKoreanWon(monthlyIncome)}</dd>
          </div>
          <div>
            <dt>계산된 하루 예산</dt>
            <dd>{formatKoreanWon(budgetAmount)}</dd>
          </div>
          <div>
            <dt>남은 일수</dt>
            <dd>{getRemainingDaysInMonth()}일</dd>
          </div>
        </dl>

        <p className="message-box message-box--hint">
          월 수입을 다시 저장하면 하루 예산도 함께 갱신됩니다.
        </p>
      </section>
    </section>
  );
}

export default BudgetStatus;
