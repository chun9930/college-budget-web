import React from 'react';
export default function SummaryCard({ title, value, note }) {
  return (
    <article className="card summary-card">
      <h3>{title}</h3>
      <p className="summary-value">{value}</p>
      {note ? <p className="summary-note">{note}</p> : null}
    </article>
  );
}

