import React from 'react';
export default function StatusBadge({ label, tone = 'safe' }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}

