import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/budget-settings', label: '예산' },
  { to: '/expense-records', label: '기록' },
  { to: '/statistics', label: '분석' },
  { to: '/calendar', label: '달력' },
];

export default function Header({ currentUser, onLogout }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          <img src="/logo.svg" alt="" />
        </span>
        <span className="brand-copy">
          <strong>Pingo</strong>
          <span>소비 판단 도구</span>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="주요 페이지">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        {currentUser ? (
          <>
            <Link className="nav-link" to="/my-page">
              {currentUser.name}님
            </Link>
            <button className="nav-link button-link" type="button" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link className="nav-link" to="/login">
              로그인
            </Link>
            <Link className="nav-link" to="/signup">
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
