import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import SummaryCard from '../components/SummaryCard';

function formatMoney(value) {
  return `${Math.round(Number(value || 0)).toLocaleString()}원`;
}

export default function MyPage({
  currentUser,
  budgetSettings,
  savingGoalSettings,
  onLogout,
  onResetData,
}) {
  const handleReset = () => {
    onResetData();
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">마이페이지</h1>
          <p className="page-subtitle">mock auth 사용자 정보와 예산 상태를 확인합니다.</p>
        </div>
      </div>

      {!currentUser ? (
        <EmptyState
          title="로그인이 필요합니다"
          description="회원가입 또는 로그인 후 마이페이지를 사용할 수 있습니다."
          action={
            <div className="form-actions">
              <PrimaryButton to="/login">로그인</PrimaryButton>
              <PrimaryButton to="/signup" variant="ghost">
                회원가입
              </PrimaryButton>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid-3">
            <SummaryCard title="사용자 이름" value={currentUser.name} note={currentUser.email} />
            <SummaryCard
              title="예산 요약"
              value={budgetSettings.useManualBudget ? '수동 예산 사용' : '자동 예산 사용'}
              note={`이번 달 ${budgetSettings.carryOverEnabled ? 'ON' : 'OFF'}`}
            />
            <SummaryCard
              title="목표 요약"
              value={budgetSettings.goalEnabled ? '목표 설정 ON' : '목표 설정 OFF'}
              note={`목표 금액 ${formatMoney(savingGoalSettings.goalAmount)}`}
            />
          </div>

          <div className="grid-2">
            <article className="card stack">
              <h2 className="section-title">기능 상태</h2>
              <ul className="plain-list">
                <li>목표 설정: {budgetSettings.goalEnabled ? 'ON' : 'OFF'}</li>
                <li>기간별 저축 계산: {budgetSettings.periodCalculationEnabled ? 'ON' : 'OFF'}</li>
                <li>이번 달 기능: {budgetSettings.carryOverEnabled ? 'ON' : 'OFF'}</li>
                <li>수동 하루 예산: {budgetSettings.useManualBudget ? 'ON' : 'OFF'}</li>
              </ul>
            </article>

            <article className="card stack">
              <h2 className="section-title">계정 관리</h2>
              <p className="muted">
                데이터 초기화는 예산, 지출 기록, 알림 기록만 비우고 로그인 상태와 계정 정보는
                유지합니다.
              </p>
              <div className="form-actions">
                <PrimaryButton onClick={handleReset} variant="ghost">
                  데이터 초기화
                </PrimaryButton>
                <PrimaryButton onClick={onLogout}>로그아웃</PrimaryButton>
              </div>
            </article>
          </div>

          <Link className="muted" to="/budget-settings">
            예산 설정 다시 보기
          </Link>
        </>
      )}
    </section>
  );
}
