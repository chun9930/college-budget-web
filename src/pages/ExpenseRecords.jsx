import { useState } from 'react';
import { categories } from '../data/categories.js';
import { expenseTypes } from '../data/expenseTypes.js';
import { paymentMethods } from '../data/paymentMethods.js';
import { formatKoreanWon, parseMoneyInput } from '../lib/budget.js';
import {
  createExpenseRecord,
  createExpenseTemplate,
  isValidExpenseAmount,
} from '../lib/expense.js';
import {
  addExpenseRecord,
  addExpenseTemplate,
  getExpenseRecords,
  getExpenseTemplates,
  removeExpenseTemplate,
} from '../lib/storage.js';

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTemplateForm(template) {
  return {
    amount: template ? String(template.amount ?? '') : '',
    category: template?.category || categories[0],
    paymentMethod: template?.paymentMethod || paymentMethods[0],
    expenseType: template?.expenseType || expenseTypes[0],
    date: template?.date || getTodayInputValue(),
    memo: template?.memo || '',
    templateName: template?.name || '',
  };
}

function ExpenseRecords() {
  const [records, setRecords] = useState(() => getExpenseRecords());
  const [templates, setTemplates] = useState(() => getExpenseTemplates());
  const [formState, setFormState] = useState(() => normalizeTemplateForm());
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('success');
  const [templateMessage, setTemplateMessage] = useState('');
  const [templateMessageTone, setTemplateMessageTone] = useState('success');

  function handleFieldChange(fieldName, value) {
    setFormState((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function validateAmountInput() {
    const parsedAmount = parseMoneyInput(formState.amount);

    if (parsedAmount === null) {
      setMessage('지출 금액은 숫자로 입력해 주세요.');
      setMessageTone('error');
      return null;
    }

    if (!isValidExpenseAmount(parsedAmount)) {
      setMessage('지출 금액은 0보다 큰 숫자로 입력해 주세요.');
      setMessageTone('error');
      return null;
    }

    return parsedAmount;
  }

  function saveRecord(nextRecord) {
    const nextRecords = addExpenseRecord(nextRecord);
    setRecords(nextRecords);
    setMessage('지출이 저장되었습니다.');
    setMessageTone('success');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const parsedAmount = validateAmountInput();
    if (parsedAmount === null) {
      return;
    }

    const nextRecord = createExpenseRecord({
      amount: parsedAmount,
      category: formState.category,
      paymentMethod: formState.paymentMethod,
      expenseType: formState.expenseType,
      date: formState.date,
      memo: formState.memo,
    });

    saveRecord(nextRecord);
    setFormState((current) => ({
      ...current,
      amount: '',
      memo: '',
      expenseType: current.expenseType === '일반지출' ? '일반지출' : current.expenseType,
    }));
  }

  function handleSaveTemplate() {
    const parsedAmount = validateAmountInput();
    if (parsedAmount === null) {
      return;
    }

    const nextTemplate = createExpenseTemplate({
      name: formState.templateName,
      amount: parsedAmount,
      category: formState.category,
      paymentMethod: formState.paymentMethod,
      expenseType: formState.expenseType,
      memo: formState.memo,
    });

    const nextTemplates = addExpenseTemplate(nextTemplate);
    setTemplates(nextTemplates);
    setTemplateMessage('템플릿이 저장되었습니다.');
    setTemplateMessageTone('success');
  }

  function handleApplyTemplate(template) {
    setFormState({
      amount: String(template.amount ?? ''),
      category: template.category || categories[0],
      paymentMethod: template.paymentMethod || paymentMethods[0],
      expenseType: template.expenseType || expenseTypes[0],
      date: getTodayInputValue(),
      memo: template.memo || '',
      templateName: template.name || '',
    });
    setTemplateMessage(`"${template.name}" 템플릿을 불러왔습니다.`);
    setTemplateMessageTone('success');
  }

  function handleRemoveTemplate(templateId) {
    const nextTemplates = removeExpenseTemplate(templateId);
    setTemplates(nextTemplates);
    setTemplateMessage('템플릿을 삭제했습니다.');
    setTemplateMessageTone('success');
  }

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">지출 기록</p>
        <h2>지출을 저장하고 템플릿으로 반복 입력을 줄이세요</h2>
        <p className="section-lead">
          결제 수단과 지출 타입까지 함께 저장하고, 자주 쓰는 항목은 템플릿으로 저장해서
          반복 입력 없이 바로 불러올 수 있습니다.
        </p>
      </header>

      <div className="summary-grid">
        <article className="summary-card summary-card--accent">
          <span>저장된 기록</span>
          <strong>{records.length}건</strong>
        </article>
        <article className="summary-card">
          <span>저장된 템플릿</span>
          <strong>{templates.length}개</strong>
        </article>
        <article className="summary-card">
          <span>최근 저장 금액</span>
          <strong>{records[0] ? formatKoreanWon(records[0].amount) : '-'}</strong>
        </article>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>지출 입력</h3>
            <p>금액, 카테고리, 결제 수단, 타입, 날짜, 메모를 입력한 뒤 저장하면 목록에 반영됩니다.</p>
          </div>

          <form className="expense-form expense-form--stacked" onSubmit={handleSubmit} noValidate>
            <div className="form-block">
              <label htmlFor="expense-amount">지출 금액</label>
              <input
                id="expense-amount"
                type="text"
                inputMode="numeric"
                value={formState.amount}
                onChange={(event) => handleFieldChange('amount', event.target.value)}
                placeholder="예: 12000"
              />
            </div>

            <div className="form-block form-block--two-up">
              <div>
                <label htmlFor="expense-category">카테고리</label>
                <select
                  id="expense-category"
                  value={formState.category}
                  onChange={(event) => handleFieldChange('category', event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expense-payment-method">결제 수단</label>
                <select
                  id="expense-payment-method"
                  value={formState.paymentMethod}
                  onChange={(event) => handleFieldChange('paymentMethod', event.target.value)}
                >
                  {paymentMethods.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-block form-block--two-up">
              <div>
                <label htmlFor="expense-type">지출 타입</label>
                <select
                  id="expense-type"
                  value={formState.expenseType}
                  onChange={(event) => handleFieldChange('expenseType', event.target.value)}
                >
                  {expenseTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expense-date">날짜</label>
                <input
                  id="expense-date"
                  type="date"
                  value={formState.date}
                  onChange={(event) => handleFieldChange('date', event.target.value)}
                />
              </div>
            </div>

            <div className="form-block">
              <label htmlFor="expense-memo">메모</label>
              <input
                id="expense-memo"
                type="text"
                value={formState.memo}
                onChange={(event) => handleFieldChange('memo', event.target.value)}
                placeholder="예: 점심, 구독료, 월세"
              />
            </div>

            <div className="form-block">
              <label htmlFor="template-name">템플릿 이름</label>
              <input
                id="template-name"
                type="text"
                value={formState.templateName}
                onChange={(event) => handleFieldChange('templateName', event.target.value)}
                placeholder="예: 점심 식비"
              />
              <p className="field-note">자주 입력하는 항목은 이름을 붙여 템플릿으로 저장할 수 있습니다.</p>
            </div>

            <div className="action-row">
              <button type="submit">지출 저장</button>
              <button type="button" className="secondary-button" onClick={handleSaveTemplate}>
                템플릿 저장
              </button>
            </div>
          </form>

          {message ? (
            <p className={`message-box message-box--${messageTone}`}>{message}</p>
          ) : (
            <p className="message-box message-box--hint">
              숫자만 입력하면 저장할 수 있고, 템플릿을 저장하면 반복 입력을 줄일 수 있습니다.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>저장된 템플릿</h3>
            <p>자주 쓰는 지출은 템플릿으로 저장해 두고 바로 불러올 수 있습니다.</p>
          </div>

          {templateMessage ? (
            <p className={`message-box message-box--${templateMessageTone}`}>{templateMessage}</p>
          ) : null}

          {templates.length === 0 ? (
            <p className="empty-state">저장된 템플릿이 없습니다.</p>
          ) : (
            <div className="template-stack">
              {templates.map((template) => (
                <article className="template-card" key={template.id}>
                  <strong>{template.name}</strong>
                  <span>
                    {formatKoreanWon(template.amount)} · {template.category}
                  </span>
                  <div className="template-card__meta">
                    <span>{template.paymentMethod}</span>
                    <span>{template.expenseType}</span>
                  </div>
                  <div className="action-row action-row--compact">
                    <button type="button" onClick={() => handleApplyTemplate(template)}>
                      불러오기
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleRemoveTemplate(template.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

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
                <div className="record-badges">
                  <span>{record.paymentMethod}</span>
                  <span>{record.expenseType}</span>
                </div>
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
    </section>
  );
}

export default ExpenseRecords;
