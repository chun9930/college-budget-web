import React from 'react';
export default function FormField({ label, id, children, hint }) {
  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      {children}
      {hint ? <small className="muted">{hint}</small> : null}
    </label>
  );
}

