import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearLoginState, getLoginState } from '../lib/storage.js';

const emptyLoginState = {
  isLoggedIn: false,
  displayName: '',
};

function MyPage() {
  const [loginState, setLoginState] = useState(emptyLoginState);

  useEffect(() => {
    setLoginState(getLoginState());
  }, []);

  function handleLogout() {
    clearLoginState();
    setLoginState(emptyLoginState);
  }

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">마이페이지</p>
        <h2>현재 로그인 상태를 깔끔하게 확인하세요</h2>
        <p className="section-lead">
          이 페이지는 로그인 여부를 바로 확인하고, 필요하면 바로 로그아웃할 수 있게 단순하게 구성했습니다.
        </p>
      </header>

      <div className="auth-layout">
        <section className="panel">
          <div className="panel__header">
            <h3>로그인 상태</h3>
            <p>브라우저에 저장된 현재 사용자 상태를 보여줍니다.</p>
          </div>

          {loginState.isLoggedIn ? (
            <>
              <p className="message-box message-box--success">
                {loginState.displayName} 님이 로그인되어 있습니다.
              </p>
              <button type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <p className="message-box message-box--hint">아직 로그인하지 않았습니다.</p>
              <Link className="section-link" to="/login">
                로그인하러 가기
              </Link>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>안내</h3>
            <p>현재 프로젝트의 로그인은 실제 인증이 아닌 UI 상태 저장입니다.</p>
          </div>

          <p className="message-box message-box--hint">
            이름을 입력하면 상태가 저장되고, 로그아웃을 누르면 바로 초기화됩니다.
          </p>
        </section>
      </div>
    </section>
  );
}

export default MyPage;
