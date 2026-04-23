import { categories } from '../data/categories.js';
import { summarizeExpenseRecords } from '../lib/expense.js';
import { getExpenseRecords } from '../lib/storage.js';

function Statistics() {
  const records = getExpenseRecords();
  const summary = summarizeExpenseRecords(records, categories);
  const hasRecords = summary.recordCount > 0;

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">통계</p>
        <h2>저장된 지출을 카테고리별로 빠르게 확인하세요</h2>
        <p className="section-lead">
          현재는 기본 통계만 제공하지만, 총 지출과 카테고리 비율이 한눈에 보이도록 카드형 구성을 적용했습니다.
        </p>
      </header>

      <div className="stats-overview">
        <div>
          <strong>총 지출</strong>
          <span>{summary.totalAmount.toLocaleString()}원</span>
        </div>
        <div>
          <strong>기록 수</strong>
          <span>{summary.recordCount}건</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>카테고리별 지출 비중</h3>
          <p>저장된 기록이 있으면 카테고리별 막대 그래프로 간단히 보여줍니다.</p>
        </div>

        {!hasRecords ? (
          <p className="stats-empty">아직 저장된 지출 기록이 없습니다.</p>
        ) : (
          <div className="stats-list">
            {summary.categories.map((item) => (
              <div className="stats-item" key={item.category}>
                <div className="stats-item-header">
                  <strong>{item.category}</strong>
                  <span>{item.amount.toLocaleString()}원</span>
                </div>
                <div className="stats-bar" aria-hidden="true">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
                <div className="stats-item-footer">
                  <span>{item.recordCount}건</span>
                  <span>{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default Statistics;
