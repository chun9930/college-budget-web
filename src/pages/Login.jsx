import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { EMAIL_REGEX } from '../lib/auth';

const DEFAULT_FORM = {
  email: '',
  password: '',
};

const TEST_ACCOUNTS = [
  {
    name: '테스트사용자',
    email: '1234@naver.com',
    password: '1234',
    description: '기본 정상 상태, 예산 계산, 지출 기록, 분석, 달력 확인',
  },
  {
    name: '대학생테스트',
    email: 'student@pingo.com',
    password: '12345',
    description: '예산 부족/주의 상태, 소비 주의 피드백 확인',
  },
  {
    name: '위험테스트',
    email: 'danger@pingo.com',
    password: '12345',
    description: '위험 상태, 과소비 직전 확인',
  },
  {
    name: '초과테스트',
    email: 'overbudget@pingo.com',
    password: '12345',
    description: '오늘 예산 초과, 월 예산 초과, 초과 알림 확인',
  },
];

export default function Login({ currentUser, onLogin }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const updateField = (field) => (event) => {
    setFormState((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedEmail = String(formState.email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('올바른 이메일 형식으로 입력해주세요.');
      return;
    }

    const result = onLogin(formState);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/');
  };

  return (
    <section className="page-stack narrow">
      <div className="page-hero">
        <div>
          <h1 className="page-title">로그인</h1>
          <p className="page-subtitle">
            mock auth 계정으로 이메일과 비밀번호를 확인합니다.
          </p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <FormField id="login-email" label="이메일">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="이메일을 입력하세요"
            value={formState.email}
            onChange={updateField('email')}
          />
        </FormField>

        <FormField id="login-password" label="비밀번호">
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            value={formState.password}
            onChange={updateField('password')}
          />
        </FormField>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="form-actions">
          <PrimaryButton type="submit">로그인</PrimaryButton>
          <Link className="primary-button ghost" to="/signup">
            회원가입
          </Link>
        </div>
      </form>

      <section className="card stack login-test-card" aria-label="테스트 계정 안내">
        <h2 className="section-title">테스트 계정 안내</h2>
        <p className="muted">포트폴리오 확인용 mock 계정입니다. 실제 인증 정보가 아닙니다.</p>
        <div className="login-test-list">
          {TEST_ACCOUNTS.map((account) => (
            <article key={account.email} className="login-test-item">
              <strong>{account.name}</strong>
              <p className="muted">이메일: {account.email}</p>
              <p className="muted">비밀번호: {account.password}</p>
              <p className="muted">{account.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
