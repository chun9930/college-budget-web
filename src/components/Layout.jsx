import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '대시보드' },
  { path: '/budget-status', label: '예산 설정' },
  { path: '/expense-records', label: '지출 기록' },
  { path: '/statistics', label: '통계' },
  { path: '/login', label: '로그인' },
  { path: '/my-page', label: '마이페이지' },
];

function Layout({ children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>

      <header className="app-header">
        <div className="app-brand">
          <p className="app-brand__eyebrow">College Budget</p>
          <h1 className="app-title">대학생 예산 관리</h1>
          <p className="app-subtitle">
            월 수입, 하루 예산, 지출 기록, 통계를 한 화면 흐름으로 연결합니다.
          </p>
        </div>
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

      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
