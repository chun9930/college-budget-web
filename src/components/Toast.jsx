import React from 'react';

export default function Toast({ message, tone = 'success' }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`app-toast app-toast--${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
