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
      <h2>마이페이지</h2>

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
          <p className="message-box">아직 로그인하지 않았습니다.</p>
          <p>
            <Link to="/login">로그인하러 가기</Link>
          </p>
        </>
      )}
    </section>
  );
}

export default MyPage;
