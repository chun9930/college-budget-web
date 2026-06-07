import React from 'react';

export default function ExpenseSection({ title, description, children, className = '' }) {
  return (
    <section className={`expense-section ${className}`.trim()}>
      <div className="expense-section__header">
        <div className="stack">
          <h2 className="section-title">{title}</h2>
          {description ? <p className="muted expense-section__description">{description}</p> : null}
        </div>
      </div>
      <div className="expense-section__body">{children}</div>
    </section>
  );
}
