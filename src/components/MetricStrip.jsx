import React from 'react';

export default function MetricStrip({ items }) {
  return (
    <section className="metric-strip" aria-label="요약 지표">
      {items.map((item) => (
        <article key={item.title} className="metric-strip__item">
          <span className="metric-strip__label">{item.title}</span>
          <strong className="metric-strip__value">{item.value}</strong>
          {item.note ? <span className="metric-strip__note">{item.note}</span> : null}
        </article>
      ))}
    </section>
  );
}
