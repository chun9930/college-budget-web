import React, { useEffect, useMemo, useRef, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import MetricStrip from '../components/MetricStrip';
import StatusBadge from '../components/StatusBadge';
import { getHomeJudgmentSnapshot } from '../lib/alert';

export default function Home({
  dailyBudget,
  todaySpent,
  alertState,
  fixedExpenseTotal,
  remainingDays,
  currentUser,
  hasBudgetSetup,
  currentDate,
  homeViewDate,
  onHomeViewDateChange,
  todayAvailableAmount,
  alertHistory = [],
  onClearAlertHistory,
  onMarkAlertHistoryRead,
}) {
  const [isBannerExpanded, setIsBannerExpanded] = useState(true);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const homeDateInputRef = useRef(null);
  const selectedHomeDate = useMemo(() => {
    const fallbackDate = currentDate || new Date();
    return homeViewDate ? new Date(homeViewDate) : new Date(fallbackDate);
  }, [currentDate, homeViewDate]);
  const selectedHomeDateKey = useMemo(
    () =>
      `${selectedHomeDate.getFullYear()}-${String(selectedHomeDate.getMonth() + 1).padStart(2, '0')}-${String(
        selectedHomeDate.getDate()
      ).padStart(2, '0')}`,
    [selectedHomeDate]
  );
  const selectedHomeDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(selectedHomeDate),
    [selectedHomeDate]
  );
  const selectedHomeDateInputValue = selectedHomeDateKey;

  const openHomeDatePicker = () => {
    const input = homeDateInputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const commitHomeDateChange = (nextDate) => {
    if (!nextDate || Number.isNaN(nextDate.getTime())) {
      return;
    }

    onHomeViewDateChange?.(nextDate);
  };

  const shiftHomeDate = (deltaDays) => {
    const nextDate = new Date(selectedHomeDate);
    nextDate.setDate(nextDate.getDate() + deltaDays);
    commitHomeDateChange(nextDate);
  };

  const resetHomeDate = () => {
    commitHomeDateChange(currentDate || new Date());
  };

  const handleHomeDateChange = (event) => {
    const nextDateKey = event.target.value;

    if (!nextDateKey) {
      return;
    }

    commitHomeDateChange(new Date(`${nextDateKey}T00:00:00`));
  };

  const judgment = useMemo(
    () =>
      getHomeJudgmentSnapshot({
        hasBudgetSetup,
        alertState,
        dailyBudget,
        todaySpent,
      }),
    [alertState, dailyBudget, hasBudgetSetup, todaySpent]
  );

  const shouldShowBanner = judgment.statusKey !== 'safe';
  const showCollapsedBanner = shouldShowBanner && !isBannerExpanded;
  const handleToggleBanner = () => {
    setIsBannerExpanded((current) => !current);
  };

  const unreadCount = useMemo(
    () => alertHistory.filter((item) => !item.read).length,
    [alertHistory]
  );

  const formattedAlertHistory = useMemo(
    () =>
      [...alertHistory].map((item) => ({
        ...item,
        dateLabel: new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(
          item.dateKey ? new Date(`${item.dateKey}T00:00:00`) : new Date(item.createdAt)
        ),
      })),
    [alertHistory]
  );

  useEffect(() => {
    if (isAlertPanelOpen && onMarkAlertHistoryRead) {
      onMarkAlertHistoryRead();
    }
  }, [isAlertPanelOpen, onMarkAlertHistoryRead]);

  const handleToggleAlertPanel = () => {
    setIsAlertPanelOpen((current) => !current);
  };

  const handleClearAlertHistory = () => {
    onClearAlertHistory?.();
    setIsAlertPanelOpen(false);
  };

  const bannerTone = judgment.statusKey === 'setup' ? 'warning' : judgment.statusKey;

  return (
    <section className="page-stack home-page">
      <div className="page-hero home-hero">
        <div className="home-alert-anchor">
          <button
            type="button"
            className="home-alert-button"
            aria-label="알림 기록 보기"
            onClick={handleToggleAlertPanel}
          >
            <span aria-hidden="true">🔔</span>
            {unreadCount > 0 ? <span className="home-alert-button__badge">{unreadCount}</span> : null}
          </button>

          {isAlertPanelOpen ? (
            <div className="home-alert-panel card stack" role="dialog" aria-label="알림 기록">
              <div className="home-alert-panel__header">
                <strong>알림 기록</strong>
                <PrimaryButton type="button" variant="subtle" onClick={handleClearAlertHistory}>
                  전체 삭제
                </PrimaryButton>
              </div>

              {formattedAlertHistory.length > 0 ? (
                <ul className="home-alert-list">
                  {formattedAlertHistory.map((item) => (
                    <li key={item.id} className={`home-alert-item ${item.read ? 'is-read' : ''}`}>
                      <div className="home-alert-item__topline">
                        <strong>{item.statusLabel}</strong>
                        {item.relatedAmount != null ? (
                          <span className="home-alert-item__amount">{item.relatedAmount.toLocaleString()}원</span>
                        ) : null}
                      </div>
                      <p>{item.message}</p>
                      <small>{item.dateLabel}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">알림 기록이 없습니다.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">즉시 소비 판단</p>
          <h1 className="home-judgment__message">{judgment.message}</h1>
          <p className="home-judgment__subtext">{judgment.description}</p>
          <StatusBadge label={judgment.statusLabel} tone={judgment.statusKey === 'setup' ? 'warning' : judgment.statusKey} />
          {currentUser ? <p className="page-hero__meta">{currentUser.name} 님이 로그인되어 있습니다.</p> : null}
        </div>
      </div>

      <article className="card stack home-date-card">
        <div className="expense-date-field__label">기준 날짜</div>
        <div className="expense-date-field__body">
          <button
            type="button"
            className="expense-date-pill home-date-pill"
            onClick={openHomeDatePicker}
            aria-label={`기준 날짜 ${selectedHomeDateLabel}`}
          >
            <span>예산 기준일</span>
            {selectedHomeDateLabel}
          </button>
          <div className="form-actions home-date-card__actions">
            <PrimaryButton type="button" variant="subtle" onClick={() => shiftHomeDate(-1)}>
              이전 날
            </PrimaryButton>
            <PrimaryButton type="button" variant="subtle" onClick={resetHomeDate}>
              오늘
            </PrimaryButton>
            <PrimaryButton type="button" variant="subtle" onClick={() => shiftHomeDate(1)}>
              다음 날
            </PrimaryButton>
            <PrimaryButton type="button" variant="ghost" onClick={openHomeDatePicker}>
              날짜 선택
            </PrimaryButton>
          </div>
          <input
            ref={homeDateInputRef}
            type="date"
            value={selectedHomeDateInputValue}
            onChange={handleHomeDateChange}
            aria-label="홈 기준 날짜 선택"
            className="expense-date-input"
          />
        </div>
        <p className="muted">선택한 날짜 기준으로 홈의 예산 상태를 임시로 확인할 수 있습니다.</p>
      </article>

      {shouldShowBanner ? (
        <div className={`alert-banner home-banner ${bannerTone} ${showCollapsedBanner ? 'is-collapsed' : ''}`}>
          <div className="alert-copy">
            <h3>{judgment.statusLabel}</h3>
            {showCollapsedBanner ? null : <p>{judgment.description}</p>}
          </div>
          <div className="form-actions home-banner__actions">
            <PrimaryButton onClick={handleToggleBanner} variant="subtle">
              {isBannerExpanded ? '접기' : '펼치기'}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      <MetricStrip
        items={[
          {
            title: '오늘 사용 가능 금액',
            value: `${Math.round(todayAvailableAmount ?? dailyBudget).toLocaleString()}원`,
            note: `남은 일수 ${remainingDays}일 기준`,
          },
          {
            title: '오늘 지출 금액',
            value: `${Math.round(todaySpent).toLocaleString()}원`,
            note: '오늘 기록된 소비',
          },
          {
            title: '고정지출 요약',
            value: `${Math.round(fixedExpenseTotal).toLocaleString()}원`,
            note: '저장된 고정지출 기준',
          },
        ]}
      />

      <article className="card stack home-actions">
        <h2 className="section-title">빠른 이동</h2>
        <div className="form-actions home-actions__buttons">
          <PrimaryButton to="/expense-records">지출 입력</PrimaryButton>
            <PrimaryButton to="/budget-settings" variant={hasBudgetSetup ? 'ghost' : 'main'}>
              예산 설정
            </PrimaryButton>
            <PrimaryButton to="/statistics" variant="subtle">
            분석 보러가기
          </PrimaryButton>
        </div>
      </article>
    </section>
  );
}
