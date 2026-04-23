import { useState } from 'react';
import { categories } from '../data/categories.js';
import { formatKoreanWon, parseMoneyInput } from '../lib/budget.js';
import { createExpenseRecord, isValidExpenseAmount } from '../lib/expense.js';
import { addExpenseRecord, getExpenseRecords } from '../lib/storage.js';

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ExpenseRecords() {
  const [records, setRecords] = useState(() => getExpenseRecords());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(getTodayInputValue());
  const [memo, setMemo] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('success');

  function handleSubmit(event) {
    event.preventDefault();

    const parsedAmount = parseMoneyInput(amount);

    if (parsedAmount === null) {
      setMessage('지출 금액은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    if (!isValidExpenseAmount(parsedAmount)) {
      setMessage('지출 금액은 0보다 큰 숫자로 입력해 주세요.');
      setMessageTone('error');
      return;
    }

    const nextRecord = createExpenseRecord({
      amount: parsedAmount,
      category,
      date,
      memo,
    });
    const nextRecords = addExpenseRecord(nextRecord);

    setRecords(nextRecords);
    setAmount('');
    setMemo('');
    setMessage('지출이 저장되었습니다.');
    setMessageTone('success');
  }

  return (
    <section className="page-section">
      <h2>지출 기록 페이지</h2>
      <p>지출을 입력하면 저장되고 아래 목록에 바로 표시됩니다.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="expense-amount">지출 금액</label>
        <input
          id="expense-amount"
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        <label htmlFor="expense-category">카테고리</label>
        <select
          id="expense-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label htmlFor="expense-date">날짜</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />

        <label htmlFor="expense-memo">메모</label>
        <input
          id="expense-memo"
          type="text"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />

        <button type="submit">저장</button>
      </form>

      {message ? (
        <p className={`message-box message-box--${messageTone}`}>{message}</p>
      ) : null}

      <section>
        <h3>저장된 지출 기록</h3>
        {records.length === 0 ? (
          <p className="empty-state">저장된 지출 기록이 없습니다.</p>
        ) : (
          <ul className="records-list">
            {records.map((record) => (
              <li key={record.id}>
                {record.date} - {record.category} - {formatKoreanWon(record.amount)}
                {record.memo ? ` - ${record.memo}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default ExpenseRecords;
