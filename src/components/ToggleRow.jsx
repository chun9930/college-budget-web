import React from 'react';

export default function ToggleRow({ label, checked, onChange, id }) {
  return (
    <label className="toggle-row" htmlFor={id}>
      <span className="toggle-row__label">{label}</span>
      <span className="toggle-switch">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} />
        <span className="toggle-switch__track" aria-hidden="true">
          <span className="toggle-switch__thumb" />
        </span>
      </span>
    </label>
  );
}
