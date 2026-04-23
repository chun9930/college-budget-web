# AGENTS.md

## 1. Reference Document

- All tasks must follow the specifications defined in `PROJECT.md`.

---

## 2. AI Working Principles

1. Understand the overall structure first
2. Check related files before making changes
3. Propose a plan before implementation
4. Apply minimal and precise modifications
5. Write clear and understandable code
6. Always include how to test the result

---

## 3. Response Format

1. Goal
2. Files
3. Plan
4. Code
5. Test
6. Risks

- All task updates and final responses must be written in Korean.
- All approval requests, confirmation requests, and progress summaries to the user must also be written in Korean.

---

## 4. Definition of Done

- The feature works as expected
- Existing functionality is not broken
- The result can be tested
- After every completed task, 반드시 일일 로그를 작성한다.
- 일일 로그는 `daily-log/YYYY-MM-DD.md`에 한국어로 작성한다.
- 일일 로그 형식은 절대 변경하지 않는다.
- The daily log must be structured exactly with:
  1. `오늘 한 일` - 작업 내용, 검증, 특이사항
  2. `다음에 해야할 일`

## 4-1. Documentation Sync Rule

If a task changes the actual implementation structure, routes, file names, storage keys, dummy data, or user-visible behavior, update only the relevant sections of `README.md` in the same step.

Rules:
- Only update the sections related to the change
- Do not modify unrelated parts of `README.md`
- Do not document features that are not implemented
- Do not postpone `README.md` updates to later tasks

Every response must include:
- Whether `README.md` was updated
- Which sections were changed

---

## 5. Run Instructions

```bash
npm install
npm run dev
```

---

## 6. Skill Usage Rules (Strict + Safe)

### 0. Core Principle

* Skills are NOT tools.
* Skills are ROLE-BASED execution engines.
* NEVER use multiple skills at the same time for the same task.
* Treat AI-generated code as a draft, NOT as final truth.
* Prefer minimal, understandable changes over large impressive changes.

---

### 1. Process First (MANDATORY)

* Always use:

  * brainstorming
  * writing-plans
    BEFORE any implementation.

Rules:

* NEVER skip planning because of time pressure.
* If the task feels large, break it into smaller steps instead of skipping process.
* One task must have one clear goal only.

---

### 2. Implementation (frontend-skill ONLY)

* Use ONLY:

  * frontend-skill

Rules:

* Focus on "working functionality".
* DO NOT optimize structure.
* DO NOT apply design improvements.
* DO NOT create custom hooks unless explicitly required.
* DO NOT split components excessively (max 2 new components).
* DO NOT expand scope just because additional improvements seem attractive.
* Keep changes small enough that the developer can explain them directly.

---

### 3. Code Review & Refactoring

Step 1: Review

* Use:

  * requesting-code-review

Step 2: Refactor

* Use:

  * vercel-react-best-practices

Rules:

* NEVER refactor without review.
* ONLY fix issues identified in review.
* DO NOT introduce new abstraction layers.
* DO NOT over-engineer.
* Keep code understandable for beginners.
* Limit component splitting (max 2 additional components).
* DO NOT refactor unrelated areas.
* If the developer cannot explain the new structure, the refactor is too complex.
* Prefer modifying existing code over generating large new structures.

---

### 4. UI / Design

* Use:

  * frontend-design

Rules:

* Apply ONLY after functionality is complete.
* DO NOT change logic.
* DO NOT modify state management.
* Use minimal styling only.
* Avoid animations and complex UI effects.
* Prioritize readability over aesthetics.
* DO NOT redesign screens just to make them look more advanced.
* Keep the UI appropriate for a university project/demo.

---

### 5. Testing

* Use:

  * test-driven-development

Rules:

* Write failing tests first.
* Implement minimal code to pass.
* DO NOT over-test trivial UI elements.
* DO NOT skip validation just because the feature "looks correct".
* After each important change, verify the main user flow manually or with tests.

---

### 6. Debugging

* Use:

  * systematic-debugging

Rules:

* ALWAYS find root cause first.
* NEVER patch blindly.
* Reproduce issue before fixing.
* Validate after fix.
* DO NOT jump to code changes before gathering evidence.
* If repeated quick fixes fail, stop and re-check the architecture or assumptions.

---

### 7. Git Workflow

#### Parallel Work

* using-git-worktrees

Rules:

* Separate features into isolated workspaces.
* DO NOT mix multiple features in one branch.

#### Branch Completion

* finishing-a-development-branch

Rules:

* DO NOT merge without passing tests.
* Verify functionality before completion.
* DO NOT close a branch based on assumption alone.

#### Commit

* git-commit

Rules:

* Use Conventional Commit format:

  * feat:
  * fix:
  * refactor:
  * docs:
  * test:
* Keep commits small and meaningful.
* DO NOT create vague commits such as "update", "change", or "fix stuff".

#### Remote Push

Rules:

* Use `https://github.com/chun9930/college-budget-web.git` as the default GitHub remote destination for future pushes.
* For every meaningful completed change, create a clear Conventional Commit message and push it to GitHub.
* Prefer isolated feature branches or worktrees for non-trivial tasks so rollback and recovery stay easy.
* If a push, overwrite, or recovery action needs user approval, ask for that approval in Korean.

---

### 8. Anti-Risk Controls (Critical)

#### A. Prevent rule-breaking by greed

* DO NOT add extra improvements outside the current step goal.
* DO NOT say "while I'm here, I'll also..." and expand scope.
* Finish the current step, verify it, then move to the next step.

#### B. Prevent over-automation

* AI-generated code must always be reviewed before acceptance.
* DO NOT copy large generated code blocks blindly.
* DO NOT accept patterns, abstractions, hooks, or utilities that the developer cannot explain.
* Prefer existing project structure and style over auto-generated novelty.

#### C. Prevent skipped steps

* DO NOT skip brainstorming/writing-plans before implementation.
* DO NOT skip review before refactoring.
* DO NOT skip debugging process before bug fixing.
* DO NOT skip test/verification before branch completion.
* Fast delivery must come from smaller safe steps, NOT from skipping required steps.

---

### 9. Absolute Safety Rules (Critical)

❌ NEVER:

* Use multiple skills simultaneously.
* Mix implementation + refactoring + design in one step.
* Refactor without review.
* Apply design changes during logic implementation.
* Introduce unnecessary abstraction.
* Modify working code without clear reason.
* Accept AI output without understanding it.
* Skip required process steps because of urgency.

✅ ALWAYS:

* Solve ONE problem at a time.
* Follow step-by-step execution.
* Verify each step before moving forward.
* Ensure code is explainable by the developer.
* Keep the project maintainable for a beginner university student.
* Prefer simple, correct, explainable code over advanced-looking code.

---

### 10. QA Execution Flow (Mandatory)

For any non-trivial task, follow this order:

1. writing-plans
2. test-driven-development
3. implementation
4. requesting-code-review
5. systematic-debugging (if issues appear)
6. finishing-a-development-branch

Rules:
- DO NOT skip a previous step unless the task is truly trivial.
- DO NOT move to branch completion before verification is done.
- QA is considered complete only when tests, review, debugging checks, and completion checks are all satisfied.
