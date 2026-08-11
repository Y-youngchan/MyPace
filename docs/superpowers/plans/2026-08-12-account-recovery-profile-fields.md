# Account Recovery Profile Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add signup profile fields and account recovery support using name, phone number, and email.

**Architecture:** Supabase Auth remains the source of truth for passwords. MyPace stores non-password profile fields in `profiles` for support and recovery lookup. Password recovery verifies profile data first, then uses Supabase password reset email rather than changing passwords directly.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, React, React Router, Supabase JS, Vitest, Pytest.

## Global Constraints

- Do not store user passwords in MyPace database.
- Store `nickname` and `phone_number` as plain database values for future admin support workflows.
- Do not commit or push changes unless the user explicitly asks.
- Password rule: English letters plus numbers, at least 8 characters, special characters allowed.
- Password reset must use Supabase email recovery link flow.

---

### Task 1: Backend profile identity fields

**Files:**
- Modify: `backend/app/models/entities.py`
- Modify: `backend/app/schemas/finance.py`
- Modify: `backend/app/repositories/finance_repository.py`
- Modify: `backend/app/routers/profile.py`
- Create: `backend/migrations/versions/0002_add_profile_identity_fields.py`
- Test: `backend/tests/test_models.py`
- Test: `backend/tests/test_auth.py`

**Interfaces:**
- Produces: `Profile.full_name`, `Profile.nickname`, `Profile.phone_number`
- Produces: `ProfileUpsert.full_name`, `ProfileUpsert.nickname`, `ProfileUpsert.phone_number`
- Produces: profile response with the same fields.

- [ ] Write failing backend tests for new profile fields.
- [ ] Add model, schema, repository, router response changes.
- [ ] Add Alembic migration for Supabase/Postgres.
- [ ] Run backend tests.

### Task 2: Public account recovery endpoints

**Files:**
- Create: `backend/app/routers/account_recovery.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/repositories/finance_repository.py`
- Modify: `backend/app/schemas/finance.py`
- Test: `backend/tests/test_account_recovery.py`

**Interfaces:**
- Produces: `POST /api/v1/account-recovery/signup-profile`
- Produces: `POST /api/v1/account-recovery/find-email`
- Produces: `POST /api/v1/account-recovery/verify-password-reset`

- [ ] Write failing endpoint tests.
- [ ] Implement profile creation after Supabase signup.
- [ ] Implement email lookup by name and phone.
- [ ] Implement password reset eligibility check by email, name, and phone.
- [ ] Run backend tests.

### Task 3: Frontend signup fields and validation

**Files:**
- Modify: `frontend/src/features/auth/SignupPage.tsx`
- Modify: `frontend/src/features/auth/SignupPage.test.tsx`
- Create: `frontend/src/features/auth/signupValidation.ts`
- Create: `frontend/src/features/auth/signupValidation.test.ts`
- Create/Modify: `frontend/src/api/accountRecovery.ts`

**Interfaces:**
- Produces: signup form with email, password, password confirmation, full name, nickname, phone number.
- Produces: client-side password and confirmation validation.

- [ ] Write failing frontend tests.
- [ ] Add validation helper.
- [ ] Add fields to signup page.
- [ ] Save Supabase user metadata and public profile data.
- [ ] Run frontend tests.

### Task 4: Recovery pages

**Files:**
- Create: `frontend/src/features/auth/FindEmailPage.tsx`
- Create: `frontend/src/features/auth/ForgotPasswordPage.tsx`
- Create: `frontend/src/features/auth/UpdatePasswordPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/features/auth/LoginPage.tsx`

**Interfaces:**
- Produces: `/find-email`, `/forgot-password`, `/update-password`
- Uses: Supabase `resetPasswordForEmail` and `updateUser`

- [ ] Write failing route/page tests.
- [ ] Add pages and login links.
- [ ] Trigger Supabase password reset email only after profile verification.
- [ ] Run frontend tests and build.
