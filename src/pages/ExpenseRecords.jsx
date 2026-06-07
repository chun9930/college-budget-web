import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import MetricStrip from '../components/MetricStrip';
import PrimaryButton from '../components/PrimaryButton';
import {
  GENERAL_EXPENSE_CATEGORIES,
  RECURRING_EXPENSE_CATEGORIES,
} from '../lib/categories';
import { getExpensePreviewSnapshot } from '../lib/alert';
import { getToday } from '../lib/budget';

const DEFAULT_RECORD = {
  amount: '',
  category: GENERAL_EXPENSE_CATEGORIES[0] || '식비',
  paymentMethod: '카드',
  type: '일반',
  memo: '',
};

const DEFAULT_RECURRING = {
  name: '',
  amount: '',
  category: RECURRING_EXPENSE_CATEGORIES[0] || '주거/공과금',
  paymentDay: '',
  paymentMethod: '카드',
  memo: '',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function getDateKey(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
}

function getMonthKey(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}`;
}

function normalizePaymentMethod(value) {
  return ['카드', '현금', '이체'].includes(value) ? value : '카드';
}

function formatMonthLabel(date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
}

function formatDateLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function buildDateTimeFromDateKey(dateKey) {
  return `${dateKey}T00:00:00`;
}

function parseDateLike(date) {
  const current = new Date(date);
  return Number.isNaN(current.getTime()) ? null : current;
}

function sortByDate(records, sortOrder) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    return sortOrder === 'asc' ? leftTime - rightTime : rightTime - leftTime;
  });
}

export function filterAndSortExpenseRecords(
  records,
  { currentDate = getToday(), dateFilter = 'all', sortOrder = 'desc' } = {}
) {
  const currentMonthKey = getMonthKey(currentDate);
  const currentTime = new Date(currentDate).getTime();
  const filtered =
    dateFilter === 'current-month'
      ? records.filter(
          (record) =>
            getMonthKey(record.date) === currentMonthKey &&
            new Date(record.date).getTime() < currentTime
        )
      : records;

  return sortByDate(filtered, sortOrder);
}

function renderChoiceButtons(options, currentValue, onSelect, name, allowFallback = false) {
  const nextOptions =
    allowFallback && currentValue && !options.includes(currentValue)
      ? [{ value: currentValue, label: `기존: ${currentValue}` }, ...options.map((option) => ({ value: option, label: option }))]
      : options.map((option) => ({ value: option, label: option }));

  return (
    <div className="choice-group" role="group" aria-label={name}>
      {nextOptions.map((option) => {
        const isSelected = option.value === currentValue;

        return (
          <button
            key={`${name}-${option.value}`}
            type="button"
            className={`choice-button ${isSelected ? 'is-selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ExpenseRecords({
  expenseRecords = [],
  recurringExpenses = [],
  currentDate = getToday(),
  selectedDateKey,
  dailyBudget,
  todaySpent,
  hasBudgetSetup,
  onAddExpenseRecord,
  onUpdateExpenseRecord,
  onDeleteExpenseRecord,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
  showToast,
}) {
  const navigate = useNavigate();
  const initialDateKey = selectedDateKey || getDateKey(currentDate);
  const [recordForm, setRecordForm] = useState(DEFAULT_RECORD);
  const [recurringForm, setRecurringForm] = useState(DEFAULT_RECURRING);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [activeExpensePage, setActiveExpensePage] = useState('general');
  const [generalAmountTouched, setGeneralAmountTouched] = useState(false);
  const [recurringAmountTouched, setRecurringAmountTouched] = useState(false);
  const [selectedExpenseDateKey, setSelectedExpenseDateKey] = useState(initialDateKey);
  const [listMonthCursor, setListMonthCursor] = useState(() => parseDateLike(`${initialDateKey}T00:00:00`) || getToday(currentDate));
  const [optimisticExpenseRecord, setOptimisticExpenseRecord] = useState(null);

  useEffect(() => {
    setSelectedExpenseDateKey(initialDateKey);
    setListMonthCursor(parseDateLike(`${initialDateKey}T00:00:00`) || getToday(currentDate));
  }, [currentDate, initialDateKey]);

  useEffect(() => {
    if (!optimisticExpenseRecord) {
      return;
    }

    const pendingKey = [
      optimisticExpenseRecord.date,
      optimisticExpenseRecord.amount,
      optimisticExpenseRecord.category,
      optimisticExpenseRecord.paymentMethod,
      optimisticExpenseRecord.type,
      optimisticExpenseRecord.memo || '',
    ].join('|');

    const existsInRecords = expenseRecords.some((record) => {
      const recordKey = [
        record.date,
        record.amount,
        record.category,
        record.paymentMethod,
        record.type,
        record.memo || '',
      ].join('|');
      return recordKey === pendingKey;
    });

    if (existsInRecords) {
      setOptimisticExpenseRecord(null);
    }
  }, [expenseRecords, optimisticExpenseRecord]);

  const currentMonthKey = useMemo(() => getMonthKey(currentDate), [currentDate]);
  const displayExpenseRecords = useMemo(() => {
    const merged = optimisticExpenseRecord
      ? [optimisticExpenseRecord, ...expenseRecords]
      : expenseRecords;

    const seen = new Set();
    return merged.filter((record) => {
      const key = [
        record.date,
        record.amount,
        record.category,
        record.paymentMethod,
        record.type,
        record.memo || '',
      ].join('|');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [expenseRecords, optimisticExpenseRecord]);

  const currentMonthTotal = useMemo(
    () =>
      displayExpenseRecords
        .filter((record) => getMonthKey(record.date) === currentMonthKey)
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [currentMonthKey, displayExpenseRecords]
  );

  const selectedMonthKey = getMonthKey(listMonthCursor);
  const filteredGeneralRecords = useMemo(
    () =>
      sortByDate(
        displayExpenseRecords.filter((record) => getMonthKey(record.date) === selectedMonthKey),
        'desc'
      ),
    [displayExpenseRecords, selectedMonthKey]
  );

  const recentRecords = useMemo(() => displayExpenseRecords.slice(0, 10), [displayExpenseRecords]);

  const generalAmountValidation = useMemo(() => {
    const value = String(recordForm.amount || '').trim();
    const numericValue = Number(value);
    const isValid = Boolean(value) && Number.isFinite(numericValue) && numericValue > 0;
    return {
      isValid,
      numericValue: isValid ? numericValue : 0,
      message: isValid ? '' : '금액을 입력해주세요.',
    };
  }, [recordForm.amount]);

  const recurringAmountValidation = useMemo(() => {
    const value = String(recurringForm.amount || '').trim();
    const numericValue = Number(value);
    const isValid = Boolean(value) && Number.isFinite(numericValue) && numericValue > 0;
    return {
      isValid,
      numericValue: isValid ? numericValue : 0,
      message: isValid ? '' : '금액을 입력해주세요.',
    };
  }, [recurringForm.amount]);

  const spendPreview = useMemo(
    () =>
      getExpensePreviewSnapshot({
        hasBudgetSetup,
        dailyBudget,
        todaySpent,
        inputAmount: recordForm.amount,
      }),
    [dailyBudget, hasBudgetSetup, recordForm.amount, todaySpent]
  );

  const selectedDateLabel = formatDateLabel(selectedExpenseDateKey);
  const selectedDateValue = selectedExpenseDateKey;

  const updateRecordField = (field) => (event) => {
    const value = event.target.value;
    setRecordForm((current) => ({ ...current, [field]: value }));
  };

  const updateRecurringField = (field) => (event) => {
    const value = event.target.value;
    setRecurringForm((current) => ({ ...current, [field]: value }));
  };

  const updateSelectedDateKey = (nextDateKey) => {
    setSelectedExpenseDateKey(nextDateKey);
    const parsed = parseDateLike(`${nextDateKey}T00:00:00`);
    if (parsed) {
      setListMonthCursor(parsed);
    }
  };

  const updateGeneralCategory = (nextCategory) => {
    setRecordForm((current) => ({ ...current, category: nextCategory }));
  };

  const updateGeneralPaymentMethod = (nextPaymentMethod) => {
    setRecordForm((current) => ({ ...current, paymentMethod: nextPaymentMethod }));
  };

  const updateRecurringCategory = (nextCategory) => {
    setRecurringForm((current) => ({ ...current, category: nextCategory }));
  };

  const updateRecurringPaymentMethod = (nextPaymentMethod) => {
    setRecurringForm((current) => ({ ...current, paymentMethod: nextPaymentMethod }));
  };

  const fillFromRecord = (record) => {
    setActiveExpensePage('general');
    setRecordForm({
      amount: String(record.amount || ''),
      category: record.category || DEFAULT_RECORD.category,
      paymentMethod: normalizePaymentMethod(record.paymentMethod || DEFAULT_RECORD.paymentMethod),
      type: record.type || DEFAULT_RECORD.type,
      memo: record.memo || '',
    });
    setEditingExpenseId(record.id);
    setGeneralAmountTouched(true);
  };

  const fillRecurringFromItem = (item) => {
    setActiveExpensePage('recurring');
    setRecurringForm({
      name: item.name || '',
      amount: String(item.amount || ''),
      category: item.category || DEFAULT_RECURRING.category,
      paymentDay: item.paymentDay || getDateKey(currentDate),
      paymentMethod: normalizePaymentMethod(item.paymentMethod || DEFAULT_RECURRING.paymentMethod),
      memo: item.memo || '',
    });
    setEditingRecurringId(item.id);
    setRecurringAmountTouched(true);
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setRecordForm(DEFAULT_RECORD);
    setGeneralAmountTouched(false);
  };

  const cancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setRecurringForm(DEFAULT_RECURRING);
    setRecurringAmountTouched(false);
  };

  const saveExpense = (event) => {
    event.preventDefault();
    setGeneralAmountTouched(true);

    if (!generalAmountValidation.isValid) {
      return;
    }

    const payload = {
      ...recordForm,
      amount: String(generalAmountValidation.numericValue),
      paymentMethod: normalizePaymentMethod(recordForm.paymentMethod),
      date: buildDateTimeFromDateKey(selectedExpenseDateKey),
      type: '일반',
    };

    if (editingExpenseId) {
      onUpdateExpenseRecord?.(editingExpenseId, payload);
      showToast?.('일반 지출이 수정되었습니다.');
      cancelExpenseEdit();
      return;
    }

    onAddExpenseRecord?.(payload);
    setOptimisticExpenseRecord(payload);
    showToast?.('일반 지출이 저장되었습니다');
    setRecordForm((current) => ({
      ...DEFAULT_RECORD,
      paymentMethod: current.paymentMethod || DEFAULT_RECORD.paymentMethod,
    }));
    setGeneralAmountTouched(false);
  };

  const removeExpense = (expenseId) => {
    onDeleteExpenseRecord?.(expenseId);
    showToast?.('일반 지출이 삭제되었습니다.');

    if (editingExpenseId === expenseId) {
      cancelExpenseEdit();
    }
  };

  const saveRecurring = (event) => {
    event.preventDefault();
    setRecurringAmountTouched(true);

    if (!recurringAmountValidation.isValid) {
      return;
    }

    const payload = {
      ...recurringForm,
      amount: String(recurringAmountValidation.numericValue),
      paymentMethod: normalizePaymentMethod(recurringForm.paymentMethod),
    };

    if (editingRecurringId) {
      onUpdateRecurringExpense?.(editingRecurringId, payload);
      showToast?.('정기지출이 수정되었습니다.');
      cancelRecurringEdit();
      return;
    }

    onAddRecurringExpense?.(payload);
    showToast?.('정기지출이 저장되었습니다');
    setRecurringForm(DEFAULT_RECURRING);
    setRecurringAmountTouched(false);
  };

  const removeRecurring = (recurringId) => {
    onDeleteRecurringExpense?.(recurringId);
    showToast?.('정기지출이 삭제되었습니다.');

    if (editingRecurringId === recurringId) {
      cancelRecurringEdit();
    }
  };

  const goToPrevMonth = () => {
    setListMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setListMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">지출 기록</h1>
          <p className="expense-page-description">
            실제 생활 중 발생한 지출 기록을 확인하고 수정하는 영역입니다.
          </p>
          <p className="expense-page-description">
            자동 반영된 정기지출기록과 기록에는 예산 계산에서 중복 제외됩니다.
          </p>
        </div>
      </div>

      <div className="expense-page-tabs" role="tablist" aria-label="지출기록 내부 페이지">
        <button
          type="button"
          role="tab"
          aria-selected={activeExpensePage === 'general'}
          className={`expense-page-tab ${activeExpensePage === 'general' ? 'is-active' : ''}`}
          onClick={() => setActiveExpensePage('general')}
        >
          일반 지출 기록
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeExpensePage === 'recurring'}
          className={`expense-page-tab ${activeExpensePage === 'recurring' ? 'is-active' : ''}`}
          onClick={() => setActiveExpensePage('recurring')}
        >
          정기지출 관리
        </button>
      </div>

      {activeExpensePage === 'general' ? (
        <section className="card stack">
          <h3 className="section-title">일반 지출 기록</h3>

          <MetricStrip
            items={[
              {
                title: '이번 달 지출',
                value: `${Math.round(currentMonthTotal).toLocaleString()}원`,
                note: '월간 지출 합계',
              },
              {
                title: '최근 입력',
                value: `${recentRecords.length}건`,
                note: '최근 기록 10건 기준',
              },
            ]}
          />

          <p className="muted expense-page-description">
            일반 지출은 식비, 카페, 교통비처럼 실제 생활 중 발생한 비용을 기록하는 곳입니다.
            정기 반영한 정기지출은 기록에서는 한 번만 표시됩니다.
          </p>

          <div className="expense-section__grid expense-section__grid--general">
            <form className="card form-grid" onSubmit={saveExpense}>
              <h3 className="section-title">지출 기록</h3>
              <div className="calendar-date-banner">
                <strong>선택 날짜</strong>
                <button
                  type="button"
                  aria-label="지출 날짜 선택"
                  className="text-button"
                  onClick={() => updateSelectedDateKey(selectedExpenseDateKey)}
                >
                  {selectedDateValue}
                </button>
              </div>
              <input
                id="expense-date"
                type="date"
                value={selectedExpenseDateKey}
                onChange={(event) => updateSelectedDateKey(event.target.value)}
              />
              {editingExpenseId ? (
                <div className="alert-banner">
                  <strong>지출 기록 수정 중</strong>
                  <div className="muted">
                    {Number(recordForm.amount || 0).toLocaleString()}원 · {recordForm.category}
                  </div>
                </div>
              ) : null}

              <FormField id="expense-amount" label="금액">
                <input
                  id="expense-amount"
                  type="text"
                  inputMode="numeric"
                  value={recordForm.amount}
                  onChange={(event) => {
                    setGeneralAmountTouched(true);
                    updateRecordField('amount')(event);
                  }}
                  aria-invalid={Boolean(generalAmountTouched && !generalAmountValidation.isValid)}
                  className={generalAmountTouched && !generalAmountValidation.isValid ? 'input-error' : ''}
                />
                {generalAmountTouched && !generalAmountValidation.isValid ? (
                  <p className="error-text">{generalAmountValidation.message}</p>
                ) : null}
                <p className={`muted expense-preview expense-preview--${spendPreview.statusKey}`}>
                  <strong>{spendPreview.statusLabel}</strong>
                  <span>{spendPreview.message}</span>
                </p>
              </FormField>

              <FormField id="expense-category" label="카테고리">
                {renderChoiceButtons(
                  GENERAL_EXPENSE_CATEGORIES,
                  recordForm.category,
                  updateGeneralCategory,
                  '일반 지출 카테고리',
                  true
                )}
              </FormField>

              <FormField id="expense-method" label="결제수단">
                {renderChoiceButtons(
                  ['카드', '현금', '이체'],
                  normalizePaymentMethod(recordForm.paymentMethod),
                  updateGeneralPaymentMethod,
                  '일반 지출 결제수단'
                )}
              </FormField>

              <div className="form-actions">
                {editingExpenseId ? (
                  <>
                    <button className="text-button" type="button" onClick={cancelExpenseEdit}>
                      수정 취소
                    </button>
                    <PrimaryButton type="submit" disabled={!generalAmountValidation.isValid}>
                      지출 수정 저장
                    </PrimaryButton>
                  </>
                ) : (
                  <PrimaryButton type="submit" disabled={!generalAmountValidation.isValid}>
                    지출 저장
                  </PrimaryButton>
                )}
              </div>
            </form>

            <section className="card stack">
              <div className="form-actions">
                <button type="button" className="calendar-nav" onClick={goToPrevMonth}>
                  이전 달
                </button>
                <strong>{formatMonthLabel(listMonthCursor)}</strong>
                <button type="button" className="calendar-nav" onClick={goToNextMonth}>
                  다음 달
                </button>
              </div>

              <h3 className="section-title">일반 지출 기록 목록</h3>
              {filteredGeneralRecords.length > 0 ? (
                <div className="list">
                  {filteredGeneralRecords.map((item) => (
                    <div key={item.id} className="list-item recurring-item">
                      <div>
                        <strong>{Number(item.amount || 0).toLocaleString()}원</strong>
                        <div className="muted">
                          {item.category} · {normalizePaymentMethod(item.paymentMethod)}
                        </div>
                        <div className="muted">{new Date(item.date).toLocaleDateString('ko-KR')}</div>
                        {item.sourceRecurringId ? (
                          <>
                            <span className="expense-source-badge">자동 정기지출</span>
                            <p className="expense-source-note">예산 계산 중복 제외</p>
                          </>
                        ) : null}
                      </div>
                      <div className="inline-actions">
                        <button type="button" className="text-button" onClick={() => fillFromRecord(item)}>
                          수정
                        </button>
                        <button type="button" className="text-button" onClick={() => removeExpense(item.id)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="일반 지출 기록이 없습니다"
                  description="금액, 카테고리, 결제수단을 입력하면 목록과 달력에 반영됩니다."
                />
              )}

            </section>
          </div>
        </section>
      ) : (
        <section className="card stack">
          <h3 className="section-title">정기지출 관리</h3>
          <div className="calendar-date-banner">
            <strong>정기지출 합계</strong>
            <span>
              {Math.round(
                recurringExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
              ).toLocaleString()}원
            </span>
          </div>

          <p className="muted expense-page-description">
            정기지출은 주거비, 통신비, 구독 서비스처럼 반복되는 고정 비용을 관리합니다.
          </p>

          <div className="grid-2 expense-section__grid">
            <form className="card form-grid" onSubmit={saveRecurring}>
              <h3 className="section-title">정기지출 관리</h3>
              {editingRecurringId ? (
                <div className="alert-banner">
                  <strong>정기지출 수정 중</strong>
                  <div className="muted">
                    {recurringForm.name || '목표 없음'} · {Number(recurringForm.amount || 0).toLocaleString()}원
                  </div>
                </div>
              ) : null}

              <FormField id="recurring-name" label="항목명">
                <input
                  id="recurring-name"
                  value={recurringForm.name}
                  onChange={updateRecurringField('name')}
                />
              </FormField>

              <FormField id="recurring-amount" label="금액">
                <input
                  id="recurring-amount"
                  type="text"
                  inputMode="numeric"
                  value={recurringForm.amount}
                  onChange={(event) => {
                    setRecurringAmountTouched(true);
                    updateRecurringField('amount')(event);
                  }}
                  aria-invalid={Boolean(recurringAmountTouched && !recurringAmountValidation.isValid)}
                  className={recurringAmountTouched && !recurringAmountValidation.isValid ? 'input-error' : ''}
                />
                {recurringAmountTouched && !recurringAmountValidation.isValid ? (
                  <p className="error-text">{recurringAmountValidation.message}</p>
                ) : null}
              </FormField>

              <FormField id="recurring-day" label="결제일">
                <input
                  id="recurring-day"
                  type="date"
                  value={recurringForm.paymentDay}
                  onChange={updateRecurringField('paymentDay')}
                />
              </FormField>

              <FormField id="recurring-category" label="카테고리">
                {renderChoiceButtons(
                  RECURRING_EXPENSE_CATEGORIES,
                  recurringForm.category,
                  updateRecurringCategory,
                  '정기지출 카테고리',
                  true
                )}
              </FormField>

              <FormField id="recurring-method" label="결제수단">
                {renderChoiceButtons(
                  ['카드', '현금', '이체'],
                  normalizePaymentMethod(recurringForm.paymentMethod),
                  updateRecurringPaymentMethod,
                  '정기지출 결제수단'
                )}
              </FormField>

              <div className="form-actions">
                {editingRecurringId ? (
                  <>
                    <button className="text-button" type="button" onClick={cancelRecurringEdit}>
                      수정 취소
                    </button>
                    <PrimaryButton type="submit" disabled={!recurringAmountValidation.isValid}>
                      정기지출 수정 저장
                    </PrimaryButton>
                  </>
                ) : (
                  <PrimaryButton type="submit" disabled={!recurringAmountValidation.isValid}>
                    정기지출 저장
                  </PrimaryButton>
                )}
              </div>
            </form>

            <section className="card stack">
              <h3 className="section-title">정기지출 목록</h3>
              {recurringExpenses.length > 0 ? (
                <div className="list">
                  {recurringExpenses.map((item) => (
                    <div key={item.id} className="list-item recurring-item recurring-item--stacked">
                      <div className="recurring-item__content">
                        <strong>
                          {item.paymentDay} · {item.name}
                        </strong>
                        <div className="muted">
                          {item.category} · {normalizePaymentMethod(item.paymentMethod)}
                        </div>
                        <div className="muted">{Number(item.amount || 0).toLocaleString()}원</div>
                        {item.memo ? <div className="muted">{item.memo}</div> : null}
                      </div>
                      <div className="inline-actions">
                        <button type="button" className="text-button" onClick={() => fillRecurringFromItem(item)}>
                          수정
                        </button>
                        <button type="button" className="text-button" onClick={() => removeRecurring(item.id)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="정기지출이 없습니다"
                  description="주거비, 구독 서비스 같은 반복 항목을 등록하면 예산 계산에 반영됩니다."
                />
              )}
            </section>
          </div>
        </section>
      )}

      <section className="card stack">
        <h3 className="section-title">최근 기록으로 빠른 입력</h3>
        <p className="muted">최근 기록을 누르면 금액과 카테고리, 결제수단이 바로 채워집니다.</p>
        {recentRecords.length > 0 ? (
          <div className="list">
            {recentRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                className="list-item recent-record-button"
                onClick={() => fillFromRecord(record)}
              >
                <div>
                  <strong>{Number(record.amount || 0).toLocaleString()}원</strong>
                  <div className="muted">
                    {record.category} · {normalizePaymentMethod(record.paymentMethod)}
                  </div>
                </div>
                <time className="muted" dateTime={record.date}>
                  {new Date(record.date).toLocaleDateString('ko-KR')}
                </time>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="기록이 없습니다"
            description="지출을 저장하면 최근 기록으로 빠른 입력 영역이 채워집니다."
          />
        )}
      </section>
    </section>
  );
}
