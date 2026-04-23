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
      <h2>로그인</h2>
      <p>이 프로젝트의 로그인은 이름과 상태만 저장하는 간단한 UI입니다.</p>

      {isLoggedIn ? (
        <p className="message-box message-box--success">
          현재 {displayName} 님이 로그인된 상태입니다.
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
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

      {message ? <p className="message-box">{message}</p> : null}
      <p>
        <Link to="/my-page">마이페이지로 이동</Link>
      </p>
    </section>
  );
}

export default Loginpage;
