import React from 'react';
export default function EmptyState({ title, description, action }) {
  return (
    <div className="card stack">
      <strong>{title}</strong>
      <p className="muted">{description}</p>
      {action ? action : null}
    </div>
  );
}

