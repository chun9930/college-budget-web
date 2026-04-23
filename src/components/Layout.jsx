import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '메인' },
  { path: '/login', label: '로그인' },
  { path: '/expense-records', label: '지출 기록' },
  { path: '/budget-status', label: '예산 상태' },
  { path: '/statistics', label: '통계' },
  { path: '/my-page', label: '마이페이지' },
];

function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">College Budget</h1>
        <p className="app-subtitle">
          대학생 생활비 관리 프로젝트의 기본 구조입니다.
        </p>
      </header>

      <nav className="app-nav" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  );
}

export default Layout;
