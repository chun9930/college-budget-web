import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calculateDailyBudget,
  formatKoreanWon,
  judgeSpending,
  parseMoneyInput,
} from '../lib/budget.js';
import {
  getBudgetAmount,
  getMonthlyIncome,
  setBudgetAmount,
  setMonthlyIncome,
} from '../lib/storage.js';

function Mainpage() {
  const savedMonthlyIncome = getMonthlyIncome();
  const savedBudgetAmount = getBudgetAmount();
  const currentDailyBudget =
    savedBudgetAmount > 0 ? savedBudgetAmount : calculateDailyBudget(savedMonthlyIncome);

  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState(
    savedMonthlyIncome > 0 ? String(savedMonthlyIncome) : '',
  );
  const [incomeMessage, setIncomeMessage] = useState('');
  const [incomeTone, setIncomeTone] = useState('success');
  const [spendingAmountInput, setSpendingAmountInput] = useState('');
  const [judgment, setJudgment] = useState(null);

  function handleIncomeSubmit(event) {
    event.preventDefault();

    if (monthlyIncomeInput.trim() === '') {
      setIncomeMessage('월 수입을 입력해 주세요.');
      setIncomeTone('error');
      return;
    }

    const parsedMonthlyIncome = parseMoneyInput(monthlyIncomeInput);
    if (parsedMonthlyIncome === null) {
      setIncomeMessage('월 수입은 숫자로 입력해 주세요.');
      setIncomeTone('error');
      return;
    }

    if (parsedMonthlyIncome <= 0) {
      setIncomeMessage('월 수입은 0보다 큰 숫자로 입력해 주세요.');
      setIncomeTone('error');
      return;
    }

    const nextBudgetAmount = calculateDailyBudget(parsedMonthlyIncome);
    setMonthlyIncome(parsedMonthlyIncome);
    setBudgetAmount(nextBudgetAmount);
    setIncomeMessage('월 수입을 저장하면 하루 예산이 계산됩니다.');
    setIncomeTone('success');
    setJudgment(null);
  }

  function handleSpendingSubmit(event) {
    event.preventDefault();

    const parsedSpendingAmount = parseMoneyInput(spendingAmountInput);
    const result = judgeSpending({
      spendingAmount: parsedSpendingAmount,
      dailyBudget: getBudgetAmount() || calculateDailyBudget(getMonthlyIncome()),
    });

    setJudgment(result);
  }

  return (
    <section className="page-section">
      <h2>메인 페이지</h2>
      <p>월 수입을 저장하고 오늘 예산 안에서 지출할 수 있는지 바로 확인합니다.</p>

      <div className="page-grid">
        <section>
          <h3>월 수입 입력</h3>
          <p>월 수입을 저장하면 하루 예산이 계산됩니다.</p>

          <form onSubmit={handleIncomeSubmit} noValidate>
            <label htmlFor="monthly-income">월 수입</label>
            <input
              id="monthly-income"
              type="text"
              inputMode="numeric"
              value={monthlyIncomeInput}
              onChange={(event) => setMonthlyIncomeInput(event.target.value)}
            />
            <button type="submit">저장</button>
          </form>

          {incomeMessage ? (
            <p className={`message-box message-box--${incomeTone}`}>{incomeMessage}</p>
          ) : (
            <p className="message-box">숫자만 입력하면 저장할 수 있습니다.</p>
          )}
        </section>

        <section>
          <h3>실시간 소비 판단</h3>
          <p>지출 금액을 입력하고 판정하기를 눌러 보세요.</p>

          <form onSubmit={handleSpendingSubmit} noValidate>
            <label htmlFor="spending-amount">지출 금액</label>
            <input
              id="spending-amount"
              type="text"
              inputMode="numeric"
              placeholder="예: 12000"
              value={spendingAmountInput}
              onChange={(event) => {
                setSpendingAmountInput(event.target.value);
                setJudgment(null);
              }}
            />
            <button type="submit">판정하기</button>
          </form>

          {judgment ? (
            <div
              className={`message-box ${
                judgment.status === 'over'
                  ? 'message-box--warning'
                  : judgment.status === 'invalid'
                    ? 'message-box--error'
                    : 'message-box--success'
              }`}
            >
              <strong>{judgment.title}</strong>
              <p>{judgment.message}</p>
              {judgment.warning ? <p>{judgment.warning}</p> : null}
            </div>
          ) : (
            <p className="message-box">
              지출 금액을 입력한 뒤 판정하기를 누르면 결과가 표시됩니다.
            </p>
          )}
        </section>
      </div>

      <dl className="summary-list">
        <div>
          <dt>저장된 월 수입</dt>
          <dd>{formatKoreanWon(savedMonthlyIncome)}</dd>
        </div>
        <div>
          <dt>현재 하루 예산</dt>
          <dd>{formatKoreanWon(currentDailyBudget)}</dd>
        </div>
      </dl>

      <p>
        <Link to="/budget-status">예산 상태 보기</Link>
      </p>
    </section>
  );
}

export default Mainpage;
