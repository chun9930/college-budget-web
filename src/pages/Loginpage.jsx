import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLoginState, setLoginState } from '../lib/storage.js';

function Loginpage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loginState = getLoginState();
    if (loginState.isLoggedIn) {
      setIsLoggedIn(true);
      setDisplayName(loginState.displayName);
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setMessage('이름을 입력해 주세요.');
      return;
    }

    setLoginState({
      isLoggedIn: true,
      displayName: trimmedName,
    });
    setIsLoggedIn(true);
    setMessage('로그인 상태가 저장되었습니다.');
    navigate('/my-page');
  }

  return (
    <section className="page-section">
      <header className="page-hero">
        <p className="section-eyebrow">로그인</p>
        <h2>이름만 입력해서 현재 상태를 저장하세요</h2>
        <p className="section-lead">
          실제 인증이 아니라 UI 상태 저장용 로그인입니다. 데모 흐름이 더 자연스럽게 보이도록 카드형 레이아웃으로 정리했습니다.
        </p>
      </header>

      <div className="auth-layout">
        <section className="panel">
          <div className="panel__header">
            <h3>로그인 정보</h3>
            <p>이름만 입력하면 로그인 상태가 저장됩니다.</p>
          </div>

          {isLoggedIn ? (
            <p className="message-box message-box--success">
              현재 {displayName} 님이 로그인된 상태입니다.
            </p>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="displayName">이름</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="예: 대학생"
            />
            <button type="submit">로그인</button>
          </form>

          {message ? <p className="message-box message-box--hint">{message}</p> : null}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>이 화면에서 할 수 있는 일</h3>
            <p>현재 기능은 이름과 로그인 상태를 저장하는 데 초점을 둡니다.</p>
          </div>

          <p className="message-box message-box--hint">
            로그인 후에는 마이페이지에서 현재 상태를 확인하고 로그아웃할 수 있습니다.
          </p>
          <Link className="section-link" to="/my-page">
            마이페이지로 이동
          </Link>
        </section>
      </div>
    </section>
  );
}

export default Loginpage;
