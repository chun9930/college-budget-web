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
      <header className="page-hero">
        <p className="section-eyebrow">지출 기록</p>
        <h2>지출을 저장하고 목록으로 바로 확인하세요</h2>
        <p className="section-lead">
          현재 기능은 단순하지만, 입력 영역과 저장 목록을 카드형으로 분리해서 한눈에 보기 쉽게 구성했습니다.
        </p>
      </header>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>지출 입력</h3>
            <p>금액, 카테고리, 날짜, 메모를 입력한 뒤 저장하면 바로 목록에 반영됩니다.</p>
          </div>

          <form className="expense-form" onSubmit={handleSubmit} noValidate>
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
          ) : (
            <p className="message-box message-box--hint">
              숫자만 입력하면 저장할 수 있고, 저장 즉시 아래 목록에 반영됩니다.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>최근 저장된 기록</h3>
            <p>가장 최근에 저장한 지출부터 위에 보이도록 정렬됩니다.</p>
          </div>

          {records.length === 0 ? (
            <p className="empty-state">저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="records-stack">
              {records.map((record) => (
                <article className="record-card" key={record.id}>
                  <strong>
                    {record.date} · {record.category}
                  </strong>
                  <span>{record.memo || '메모 없음'}</span>
                  <div className="record-card__meta">
                    <span>{formatKoreanWon(record.amount)}</span>
                    <span>{record.memo ? '메모 포함' : '메모 없음'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default ExpenseRecords;
