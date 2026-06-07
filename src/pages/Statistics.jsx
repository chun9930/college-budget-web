import React, { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import {
  getCategorySpendingSummary,
  getMonthlySpendingComparison,
  getOverspendingFeedback,
  getStudentSavingsTips,
  getToday,
} from '../lib/budget';

function formatWon(amount) {
  return `${Math.round(Number(amount || 0)).toLocaleString('ko-KR')}원`;
}

function formatSignedWon(amount) {
  const value = Math.round(Number(amount || 0));
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('ko-KR')}원`;
}

function formatMonthValue(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

function monthValueToDate(monthValue, fallbackDate = getToday()) {
  if (!monthValue || typeof monthValue !== 'string') {
    return getToday(fallbackDate);
  }

  const [yearText, monthText] = monthValue.split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return getToday(fallbackDate);
  }

  return new Date(year, month - 1, 1);
}

function shiftMonthValue(monthValue, step, fallbackDate = getToday()) {
  const current = monthValueToDate(monthValue, fallbackDate);
  const next = new Date(current);
  next.setMonth(next.getMonth() + step);
  return formatMonthValue(next);
}

function formatMonthLabel(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월 기준`;
}

function formatMonthHeading(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월 지출 분석`;
}

function formatDayLabel(dateKey) {
  const [, , day] = dateKey.split('-');
  return `${Number(day)}일 총 지출`;
}

function formatChangeLabel(changeAmount) {
  if (changeAmount > 0) {
    return `지난달보다 ${formatSignedWon(changeAmount)} 늘었습니다`;
  }

  if (changeAmount < 0) {
    return `지난달보다 ${formatSignedWon(changeAmount)} 줄었습니다`;
  }

  return '지난달과 비슷한 수준입니다';
}

function getAnalysisEmptyMessage(monthLabel) {
  return `${monthLabel}에는 분석할 지출 기록이 없습니다.`;
}

export default function Statistics({ expenseRecords = [], currentDate = getToday() }) {
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthValue(currentDate));

  const analysisDate = useMemo(
    () => monthValueToDate(selectedMonth, currentDate),
    [selectedMonth, currentDate]
  );

  const monthLabel = useMemo(() => formatMonthLabel(analysisDate), [analysisDate]);
  const monthHeading = useMemo(() => formatMonthHeading(analysisDate), [analysisDate]);

  const summary = useMemo(
    () => getCategorySpendingSummary(expenseRecords, analysisDate, { includeRecurringSource: true }),
    [analysisDate, expenseRecords]
  );

  const comparison = useMemo(
    () => getMonthlySpendingComparison(expenseRecords, analysisDate, { includeRecurringSource: true }),
    [analysisDate, expenseRecords]
  );

  const feedbackCards = useMemo(() => getOverspendingFeedback(summary, comparison), [summary, comparison]);

  const savingsTips = useMemo(() => getStudentSavingsTips(summary, comparison), [summary, comparison]);

  const dailyEntries = useMemo(() => {
    const currentMonthRecords = summary.currentMonthRecords;
    const dailyMap = currentMonthRecords.reduce((accumulator, record) => {
      const dateKey = record.date.slice(0, 10);
      accumulator[dateKey] = (accumulator[dateKey] || 0) + Number(record.amount || 0);
      return accumulator;
    }, {});

    return Object.entries(dailyMap).sort((left, right) => left[0].localeCompare(right[0]));
  }, [summary.currentMonthRecords]);

  const maxDailyTotal = useMemo(
    () => dailyEntries.reduce((max, [, amount]) => Math.max(max, amount), 0),
    [dailyEntries]
  );

  const hasSelectedMonthRecords = summary.recordsCount > 0;
  const hasAutoRecurringRecords = summary.hasRecurringSourceRecords;

  const updateSelectedMonth = (event) => {
    setSelectedMonth(event.target.value || formatMonthValue(currentDate));
  };

  const shiftSelectedMonth = (step) => {
    setSelectedMonth((current) => shiftMonthValue(current, step, currentDate));
  };

  return (
    <section className="page-stack statistics-page">
      <div className="page-hero statistics-hero">
        <div>
          <h1 className="page-title">분석</h1>
          <p className="muted">{monthHeading}</p>
          <p className="statistics-hero__total">선택한 달 {formatWon(summary.monthlyTotal)} 썼어요</p>
          <p className="page-subtitle">선택한 달 기준으로 지출 패턴을 확인합니다</p>
        </div>
        <div className="statistics-hero__meta">
          <span className="muted">{monthLabel}</span>
          <strong>{summary.recordsCount}개 기록</strong>
        </div>
      </div>

      <div className="statistics-month-controls card">
        <div className="statistics-month-controls__group">
          <button
            type="button"
            className="primary-button ghost statistics-month-controls__button"
            onClick={() => shiftSelectedMonth(-1)}
          >
            이전 달
          </button>
          <div className="statistics-month-controls__field">
            <label className="sr-only" htmlFor="statisticsMonth">
              분석 월 선택
            </label>
            <input
              id="statisticsMonth"
              type="month"
              value={selectedMonth}
              onChange={updateSelectedMonth}
              className="statistics-month-controls__input"
            />
          </div>
          <button
            type="button"
            className="primary-button ghost statistics-month-controls__button"
            onClick={() => shiftSelectedMonth(1)}
          >
            다음 달
          </button>
        </div>
        <p className="muted statistics-month-controls__note">
          월을 바꾸면 카테고리 비중, 전월 비교, 소비 패턴 피드백, 절약 팁이 함께 다시 계산됩니다.
        </p>
      </div>

      <p className="muted statistics-note">
        표시용 통계는 선택한 달의 지출 기록 기준으로 집계합니다. 자동 반영된 정기지출은 예산 계산에서 중복 제외됩니다.
      </p>

      {hasAutoRecurringRecords ? (
        <p className="muted statistics-note statistics-note--accent">
          자동 반영된 정기지출은 기록에는 포함되지만 예산 계산에서는 중복 제외됩니다.
        </p>
      ) : null}

      <section className="card stack">
        <div className="section-head">
          <h2 className="section-title">일별 지출 막대</h2>
          <span className="muted">선택한 달의 기록을 날짜별로 묶어 보여줍니다</span>
        </div>
        {dailyEntries.length > 0 ? (
          <div className="daily-chart" aria-label="일별 지출 막대 차트">
            {dailyEntries.map(([dateKey, amount]) => {
              const height = maxDailyTotal > 0 ? Math.max((amount / maxDailyTotal) * 100, 10) : 10;

              return (
                <div key={dateKey} className="daily-chart__item">
                  <div className="daily-chart__bar" aria-hidden="true">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <strong className="daily-chart__amount">{formatWon(amount)}</strong>
                  <span className="daily-chart__label">{formatDayLabel(dateKey)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="선택한 달에는 분석할 지출 기록이 없습니다."
            description="다른 달을 선택하거나 지출을 저장하면 일별 막대와 분석 결과가 표시됩니다."
          />
        )}
      </section>

      <div className="grid-2 statistics-grid">
        <section className="card stack statistics-category-card">
          <div className="section-head">
            <h2 className="section-title">카테고리별 지출 비중</h2>
            <span className="muted">선택한 달 기준 비율과 전월 변화량을 함께 봅니다</span>
          </div>

          {summary.categoryEntries.length > 0 ? (
            <div className="list">
              {summary.categoryEntries.map((entry) => {
                const comparisonRow =
                  comparison.categoryComparisons.find((item) => item.category === entry.category) ||
                  null;

                return (
                  <div key={entry.category} className="category-stat">
                    <div className="list-item">
                      <strong>{entry.category}</strong>
                      <span className="muted">
                        {entry.ratio}% · {formatWon(entry.amount)}
                      </span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(entry.ratio, 0)}%` }} />
                    </div>
                    <p className="muted statistics-category-trend">
                      {comparisonRow && comparisonRow.previousAmount > 0
                        ? `지난달 ${formatWon(comparisonRow.previousAmount)} · ${formatSignedWon(
                            comparisonRow.changeAmount
                          )} (${comparisonRow.changeRate}%)`
                        : '지난달 기록이 없어 전월 비교는 불가능합니다.'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={getAnalysisEmptyMessage(monthLabel)}
              description="지출 기록이 있어야 카테고리 비중과 변화를 계산할 수 있습니다."
            />
          )}
        </section>

        <div className="stack">
          <section className="card stack">
            <h2 className="section-title">이번 달 가장 많이 쓴 항목</h2>
            {hasSelectedMonthRecords ? (
              <>
                <p className="statistics-highlight">
                  이번 달 가장 많이 쓴 항목은 <strong>{summary.topCategory.category}</strong>예요.
                </p>
                <p className="muted">
                  {formatWon(summary.topCategory.amount)} · 전체의 {summary.topCategoryRatio}%를 차지합니다.
                </p>
              </>
            ) : (
              <EmptyState
                title={getAnalysisEmptyMessage(monthLabel)}
                description="기록이 쌓이면 가장 많이 쓴 항목과 절약 우선순위를 알려드릴 수 있습니다."
              />
            )}
          </section>

          <section className="card stack">
            <h2 className="section-title">전월 대비 변화</h2>
            {hasSelectedMonthRecords ? (
              <>
                <p className="statistics-highlight">
                  이번 달 총지출은 <strong>{formatWon(comparison.currentMonthTotal)}</strong>입니다.
                </p>
                <p className="muted">
                  지난달 {formatWon(comparison.previousMonthTotal)}와 비교하면 {formatChangeLabel(comparison.changeAmount)}
                </p>
              </>
            ) : (
              <EmptyState
                title={getAnalysisEmptyMessage(monthLabel)}
                description="선택한 달에 기록이 없어서 전월 대비 변화는 아직 계산할 수 없습니다."
              />
            )}
          </section>

          <section className="card stack">
            <h2 className="section-title">소비 패턴 피드백</h2>
            <div className="list">
              {feedbackCards.map((card) => (
                <article key={`${card.title}-${card.category || card.detail}`} className="feedback-card">
                  <div className="list-item feedback-card__head">
                    <strong>{card.title}</strong>
                    {card.category ? <span className="muted">{card.category}</span> : null}
                  </div>
                  <p className="feedback-card__message">{card.message}</p>
                  {card.detail ? <p className="muted">{card.detail}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">대학생 절약 팁</h2>
            <p className="muted">현재 소비 패턴과 연결된 실천 팁입니다</p>
            <div className="list">
              {savingsTips.map((tip) => (
                <article key={`${tip.title}-${tip.category}-${tip.action}`} className="student-tip-card">
                  <div className="list-item student-tip-card__head">
                    <strong>{tip.title}</strong>
                    <span className="muted">{tip.category}</span>
                  </div>
                  <p className="student-tip-card__reason">{tip.reason}</p>
                  <p className="student-tip-card__action">{tip.action}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">절약 힌트</h2>
            <div className="list">
              <div className="list-item">
                <span>가장 큰 지출 카테고리부터 확인해보세요.</span>
              </div>
              <div className="list-item">
                <span>기록이 더 쌓이면 전월 대비 변화와 패턴 분석이 더 정확해집니다.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
