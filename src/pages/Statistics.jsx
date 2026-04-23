import { categories } from '../data/categories.js';
import { summarizeExpenseRecords } from '../lib/expense.js';
import { getExpenseRecords } from '../lib/storage.js';

function Statistics() {
  const records = getExpenseRecords();
  const summary = summarizeExpenseRecords(records, categories);
  const hasRecords = summary.recordCount > 0;

  return (
    <section className="page-section">
      <h2>통계</h2>
      <p>저장된 지출 기록을 카테고리별로 간단하게 요약해서 보여줍니다.</p>

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
  );
}

export default Statistics;
