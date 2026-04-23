# Design Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기능은 유지하면서 예전 색감과 카드형 UI를 현재 프로젝트에 다시 적용한다.

**Architecture:** 로직과 저장 구조는 그대로 두고, 레이아웃 스타일과 페이지 마크업만 최소 수정한다. 공통 톤은 CSS에서 복원하고, 페이지 컴포넌트는 카드형 섹션 구조를 맞추는 수준으로만 정리한다.

**Tech Stack:** React, Vite, JavaScript, CSS

---

### Task 1: 공통 레이아웃 톤 복원

**Files:**
- Modify: `src/index.css`
- Modify: `src/css/layout.css`

- [ ] 배경, 헤더, 네비게이션의 색감과 카드형 스타일을 복원한다.
- [ ] 모바일에서도 깨지지 않게 여백과 폭을 조정한다.

### Task 2: 페이지 카드형 구조 복원

**Files:**
- Modify: `src/pages/Mainpage.jsx`
- Modify: `src/pages/BudgetStatus.jsx`
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/pages/Loginpage.jsx`
- Modify: `src/pages/MyPage.jsx`
- Modify: `src/css/pages.css`

- [ ] 각 페이지를 카드형 섹션과 요약 블록 기준으로 정리한다.
- [ ] 상태 메시지, 요약 정보, 목록 UI를 더 분명한 블록으로 복원한다.
- [ ] 기존 입력/저장 로직은 그대로 유지한다.

### Task 3: 검증 및 기록

**Files:**
- Modify: `daily-log/2026-04-23.md`
- Modify: `README.md` (변경 필요 시 관련 섹션만)

- [ ] 빌드로 UI 수정 후 앱이 깨지지 않았는지 확인한다.
- [ ] 일일 로그에 작업과 검증 결과를 남긴다.
