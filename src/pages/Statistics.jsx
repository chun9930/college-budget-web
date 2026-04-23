import { categories } from '../data/categories.js';
import { expenseTypes } from '../data/expenseTypes.js';
import { paymentMethods } from '../data/paymentMethods.js';
import { summarizeExpenseRecords, summarizeRecordsByField } from '../lib/expense.js';
import { getExpenseRecords } from '../lib/storage.js';

function renderSummaryList(items) {
  return items.map((item) => (
    <div className="stats-item" key={item.label}>
      <div className="stats-item-header">
        <strong>{item.label}</strong>
        <span>{item.amount.toLocaleString()}원</span>
      </div>
      <div className="stats-bar" aria-hidden="true">
        <div className="stats-bar-fill" style={{ width: `${Math.max(item.percentage, 4)}%` }} />
      </div>
      <div className="stats-item-footer">
        <span>{item.recordCount}건</span>
        <span>{item.percentage.toFixed(1)}%</span>
      </div>
    </div>
  ));
}

function Statistics() {
  const records = getExpenseRecords();
  const categorySummary = summarizeExpenseRecords(records, categories);
  const typeSummary = summarizeRecordsByField(records, 'expenseType', expenseTypes);
  const paymentSummary = summarizeRecordsByField(records, 'paymentMethod', paymentMethods);
  const hasRecords = categorySummary.recordCount > 0;

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">통계</p>
        <h2>저장된 지출을 카테고리, 타입, 결제 수단별로 확인하세요</h2>
        <p className="section-lead">
          기록 구조가 확장되어, 일반 지출·고정지출·정기지출과 결제 수단별 분포까지 함께
          볼 수 있습니다.
        </p>
      </header>

      <div className="stats-overview">
        <div>
          <strong>총 지출</strong>
          <span>{categorySummary.totalAmount.toLocaleString()}원</span>
        </div>
        <div>
          <strong>기록 수</strong>
          <span>{categorySummary.recordCount}건</span>
        </div>
        <div>
          <strong>정기/고정지출</strong>
          <span>
            {
              records.filter((record) => record.expenseType === '고정지출' || record.expenseType === '정기지출').length
            }
            건
          </span>
        </div>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>카테고리별 지출 비중</h3>
            <p>저장된 기록이 있으면 카테고리별 막대 그래프로 간단히 보여줍니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="stats-list">{renderSummaryList(categorySummary.items)}</div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>지출 타입별 비중</h3>
            <p>일반지출, 고정지출, 정기지출이 얼마나 쌓였는지 확인할 수 있습니다.</p>
          </div>

          {!hasRecords ? (
            <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
          ) : (
            <div className="stats-list">{renderSummaryList(typeSummary.items)}</div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>결제 수단별 비중</h3>
          <p>카드, 현금, 이체, 간편결제를 함께 보면 반복 결제 패턴을 파악하기 쉽습니다.</p>
        </div>

        {!hasRecords ? (
          <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
        ) : (
          <div className="stats-list">{renderSummaryList(paymentSummary.items)}</div>
        )}
      </section>
    </section>
  );
}

export default Statistics;
