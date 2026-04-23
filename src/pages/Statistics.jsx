import { categories } from '../data/categories.js';
import { expenseTypes } from '../data/expenseTypes.js';
import { paymentMethods } from '../data/paymentMethods.js';
import {
  buildCategoryAnalysis,
  buildSavingHints,
  summarizeExpenseRecords,
  summarizeRecordsByField,
  summarizeRecordsByMonth,
} from '../lib/expense.js';
import { getExpenseRecords } from '../lib/storage.js';

function renderBarList(items, options = {}) {
  const { warningThreshold = null, compact = false, monthStyle = false } = options;

  return items.map((item) => {
    const hasWarning =
      warningThreshold !== null && Number(item.percentage) >= Number(warningThreshold);

    return (
      <article
        className={`analysis-item ${hasWarning ? 'analysis-item--warning' : ''} ${
          compact ? 'analysis-item--compact' : ''
        }`}
        key={item.label}
      >
        <div className="analysis-item__header">
          <strong>{item.label}</strong>
          <span>{item.amount.toLocaleString()}원</span>
        </div>

        <div className="analysis-meter" aria-hidden="true">
          <div
            className={`analysis-meter-fill ${hasWarning ? 'analysis-meter-fill--warning' : ''} ${
              monthStyle ? 'analysis-meter-fill--month' : ''
            }`}
            style={{ width: `${Math.max(item.percentage, 4)}%` }}
          />
        </div>

        <div className="analysis-item__footer">
          <span>{item.recordCount}건</span>
          <span>{item.percentage.toFixed(1)}%</span>
        </div>
      </article>
    );
  });
}

function Statistics() {
  const records = getExpenseRecords();
  const categorySummary = summarizeExpenseRecords(records, categories);
  const monthSummary = summarizeRecordsByMonth(records, 3);
  const typeSummary = summarizeRecordsByField(records, 'expenseType', expenseTypes);
  const paymentSummary = summarizeRecordsByField(records, 'paymentMethod', paymentMethods);
  const categoryAnalysis = buildCategoryAnalysis(categorySummary);
  const savingHints = buildSavingHints(categoryAnalysis);
  const hasRecords = categorySummary.recordCount > 0;
  const currentMonthSummary = monthSummary.items[monthSummary.items.length - 1] ?? {
    label: '이번 달',
    amount: 0,
    recordCount: 0,
    percentage: 0,
  };

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">통계</p>
        <h2>월별 흐름과 카테고리 초과를 한눈에 확인하세요</h2>
        <p className="section-lead">
          복잡한 그래프 대신 카드형 요약과 짧은 힌트로, 어디에서 지출이 커지는지 바로
          이해할 수 있게 구성했습니다.
        </p>
      </header>

      <div className="stats-overview">
        <div>
          <strong>총 지출</strong>
          <span>{categorySummary.totalAmount.toLocaleString()}원</span>
        </div>
        <div>
          <strong>이번 달 지출</strong>
          <span>{currentMonthSummary.amount.toLocaleString()}원</span>
        </div>
        <div>
          <strong>과소비 카테고리</strong>
          <span>{categoryAnalysis.overCategories.length}개</span>
        </div>
        <div>
          <strong>기록 수</strong>
          <span>{categorySummary.recordCount}건</span>
        </div>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>최근 3개월 지출 추세</h3>
            <p>최근 몇 달 동안 지출이 늘었는지 줄었는지 천천히 확인할 수 있습니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="analysis-list">
              {renderBarList(monthSummary.items, { compact: true, monthStyle: true })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>카테고리 초과 감지</h3>
            <p>전체 지출에서 너무 큰 비중을 차지하는 카테고리를 먼저 보여줍니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <>
              <div
                className={`message-box ${
                  categoryAnalysis.isBalanced ? 'message-box--stable' : 'message-box--warning'
                }`}
              >
                <strong>{categoryAnalysis.title}</strong>
                <p>{categoryAnalysis.message}</p>
                <p>{categoryAnalysis.advice}</p>
              </div>
              <div className="analysis-list">
                {renderBarList(categorySummary.items, { warningThreshold: 30 })}
              </div>
              {categoryAnalysis.overCategories.length > 0 ? (
                <div className="analysis-tags">
                  {categoryAnalysis.overCategories.map((item) => (
                    <span className="analysis-tag analysis-tag--warning" key={item.label}>
                      {item.label} {item.percentage.toFixed(1)}%
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>절약 힌트</h3>
          <p>지출이 큰 항목부터 조금씩 줄이는 것이 가장 효과적입니다.</p>
        </div>

        {!hasRecords ? (
          <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
        ) : (
          <div className="analysis-hint-grid">
            <article className="analysis-hint-card analysis-hint-card--accent">
              <strong>{savingHints.title}</strong>
              <p>{savingHints.primary}</p>
            </article>
            <article className="analysis-hint-card">
              <strong>다음 한 걸음</strong>
              <p>{savingHints.secondary}</p>
            </article>
          </div>
        )}
      </section>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>지출 타입별 비중</h3>
            <p>일반지출, 고정지출, 정기지출이 얼마나 쌓였는지 확인할 수 있습니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="analysis-list">{renderBarList(typeSummary.items)}</div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>결제 수단별 비중</h3>
            <p>카드, 현금, 이체, 간편결제를 함께 보면 반복 결제 패턴을 파악하기 쉽습니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="analysis-list">{renderBarList(paymentSummary.items)}</div>
          )}
        </section>
      </div>
    </section>
  );
}

export default Statistics;
