import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/budget-settings', label: '예산' },
  { to: '/expense-records', label: '기록' },
  { to: '/statistics', label: '분석' },
  { to: '/calendar', label: '달력' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          end={item.to === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
