import { formatKoreanWon, getRemainingDaysInMonth } from '../lib/budget.js';
import { getBudgetAmount, getMonthlyIncome } from '../lib/storage.js';

function BudgetStatus() {
  const monthlyIncome = getMonthlyIncome();
  const budgetAmount = getBudgetAmount();

  return (
    <section className="page-section">
      <h2>예산 상태 페이지</h2>
      <p>메인 페이지에서 저장한 월 수입과 계산된 하루 예산을 보여줍니다.</p>

      <dl className="summary-list">
        <div>
          <dt>월 수입</dt>
          <dd>{formatKoreanWon(monthlyIncome)}</dd>
        </div>
        <div>
          <dt>하루 예산</dt>
          <dd>{formatKoreanWon(budgetAmount)}</dd>
        </div>
        <div>
          <dt>이번 달 남은 일수</dt>
          <dd>{getRemainingDaysInMonth()}일</dd>
        </div>
      </dl>

      <p className="message-box">
        월 수입을 다시 저장하면 하루 예산도 함께 갱신됩니다.
      </p>
    </section>
  );
}

export default BudgetStatus;
