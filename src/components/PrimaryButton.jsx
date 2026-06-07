import React from 'react';
import { Link } from 'react-router-dom';

export default function PrimaryButton({
  children,
  to,
  onClick,
  type = 'button',
  variant = 'main',
  disabled = false,
  ...rest
}) {
  const className = `primary-button ${variant}`;

  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

