# MyPace MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React 데스크톱 웹과 FastAPI API를 통해 사용자가 수입·거래·예산을 관리하고, 실제 수입에 맞게 보정된 소비 분석과 월간 리포트를 확인할 수 있는 MyPace MVP를 구축한다.

**Architecture:** React·TypeScript 클라이언트가 Supabase Auth로 이메일·카카오 인증을 처리하고 액세스 토큰을 FastAPI에 전달한다. FastAPI는 토큰 검증, 사용자 소유권 확인, 결정적 예산·소비 계산을 수행하고 SQLAlchemy로 Supabase PostgreSQL에 접근한다. AI는 계산 결과의 설명만 담당하며 실패해도 핵심 기능에 영향을 주지 않는다.

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, Chart.js, Vitest, Testing Library, FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, psycopg 3, PyJWT, pytest, Supabase Auth/PostgreSQL/Storage, OpenAI API, ReportLab, Playwright

## Global Constraints

- 프로젝트 루트는 `D:\Personal project\MyPace`다. 상위 `Personal project` 폴더 이름은 변경하지 않는다.
- MVP의 주 개발·검수 대상은 데스크톱 웹이다.
- 768~1279px에서는 내용이 겹치거나 잘리지 않게 하되, 767px 이하의 모바일 전용 UX는 후속 범위다.
- 실제 금융결제원·은행·카드사 API, 실계좌 조회, 투자 상담, 송금·결제는 구현하지 않는다.
- 거래 시연에는 합성 데이터만 사용한다.
- 모든 사용자 소유 테이블에 `user_id`와 RLS 정책을 적용한다.
- React는 데이터베이스에 직접 쓰지 않고 FastAPI 보호 API를 사용한다.
- Supabase 공개 키만 프런트엔드에 허용하며 secret/service-role 키는 백엔드 환경변수에만 둔다.
- 클라이언트가 보낸 `user_id`를 신뢰하지 않고 검증된 JWT의 `sub`를 사용한다.
- 예산·증감률·지출률 계산은 FastAPI의 결정적 함수가 수행한다.
- AI는 수치를 계산하거나 데이터를 변경하지 않고 제공된 근거를 설명한다.
- `.env` 실제값, 토큰, 비밀번호, 연결 문자열을 Git에 커밋하거나 로그에 기록하지 않는다.
- 각 기능은 실패 테스트 → 최소 구현 → 통과 확인 → 커밋 순서로 개발한다.

---

## Target File Structure

```text
MyPace/
├── .gitignore
├── README.md
├── docs/
│   ├── mypace-product-design.md
│   └── mypace-implementation-plan.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── assets/
│   │   ├── components/common/
│   │   │   ├── AppCard.tsx
│   │   │   ├── MoneyText.tsx
│   │   │   └── PageState.tsx
│   │   ├── components/desktop/
│   │   │   ├── DesktopSidebar.tsx
│   │   │   └── TransactionTable.tsx
│   │   ├── features/auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── features/onboarding/OnboardingPage.tsx
│   │   ├── features/dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── SpendingChart.tsx
│   │   ├── features/income/IncomePage.tsx
│   │   ├── features/transactions/TransactionsPage.tsx
│   │   ├── features/budgets/BudgetPage.tsx
│   │   ├── features/analytics/AnalyticsPage.tsx
│   │   ├── features/reports/ReportsPage.tsx
│   │   ├── layouts/DesktopLayout.tsx
│   │   ├── lib/supabase.ts
│   │   ├── styles/global.css
│   │   ├── test/setup.ts
│   │   ├── types/api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── backend/
    ├── app/
    │   ├── core/config.py
    │   ├── core/security.py
    │   ├── models/entities.py
    │   ├── repositories/finance_repository.py
    │   ├── routers/analytics.py
    │   ├── routers/budgets.py
    │   ├── routers/incomes.py
    │   ├── routers/mock_banking.py
    │   ├── routers/profile.py
    │   ├── routers/reports.py
    │   ├── routers/transactions.py
    │   ├── schemas/finance.py
    │   ├── services/analytics_service.py
    │   ├── services/budget_service.py
    │   ├── services/insight_service.py
    │   ├── services/report_service.py
    │   ├── database.py
    │   ├── dependencies.py
    │   └── main.py
    ├── migrations/versions/
    ├── scripts/seed_demo.py
    ├── tests/
    │   ├── conftest.py
    │   ├── test_analytics_service.py
    │   ├── test_auth.py
    │   ├── test_budget_service.py
    │   ├── test_health.py
    │   └── test_transactions_api.py
    ├── .env.example
    ├── alembic.ini
    └── requirements.txt
```

---

## Feature-to-File Traceability

이 표는 제품 설계서의 각 기능이 어떤 코드, API, 데이터 테이블과 연결되는지 보여주는 구현 인덱스다. Task 담당자는 자신의 Task뿐 아니라 아래의 연결 파일을 함께 확인한다.

| 기능 | 프런트엔드 연결 파일 | FastAPI 연결 파일 | 데이터·외부 연결 | API | 담당 Task |
|---|---|---|---|---|---|
| 앱 시작·공통 설정 | `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/styles/global.css` | `backend/app/main.py`, `backend/app/core/config.py` | `.env.example`, CORS | `GET /health` | Task 1 |
| 이메일·카카오 로그인 | `frontend/src/lib/supabase.ts`, `frontend/src/features/auth/AuthProvider.tsx`, `LoginPage.tsx`, `ProtectedRoute.tsx` | `backend/app/core/security.py`, `backend/app/dependencies.py` | Supabase Auth, JWKS | Supabase Auth API, 보호 API 공통 | Task 3 |
| 직장인·대학생 프로필 | `frontend/src/features/onboarding/OnboardingPage.tsx` | `backend/app/routers/profile.py`, `backend/app/repositories/finance_repository.py`, `backend/app/schemas/finance.py` | `profiles` | `GET/PUT /api/v1/profile` | Task 3, 7 |
| 예상 수입·실제 수입 | `frontend/src/features/onboarding/OnboardingPage.tsx`, `frontend/src/features/income/IncomePage.tsx` | `backend/app/routers/incomes.py`, `backend/app/repositories/finance_repository.py`, `backend/app/schemas/finance.py` | `income_sources`, `income_entries` | `/api/v1/incomes` | Task 4, 7, 8 |
| 시연용 금융계정 | `frontend/src/features/transactions/TransactionsPage.tsx` | `backend/app/routers/mock_banking.py`, `backend/app/repositories/finance_repository.py` | `financial_accounts` | `/api/v1/mock-banking` | Task 4, 8 |
| 합성 거래 불러오기 | `frontend/src/features/transactions/TransactionsPage.tsx` | `backend/app/routers/mock_banking.py`, `backend/scripts/seed_demo.py` | `financial_accounts`, `transactions`, 외부 API 없음 | `POST /api/v1/mock-banking/import` | Task 4, 8 |
| 거래 추가·조회·수정·삭제 | `frontend/src/features/transactions/TransactionsPage.tsx`, `frontend/src/components/desktop/TransactionTable.tsx` | `backend/app/routers/transactions.py`, `backend/app/repositories/finance_repository.py`, `backend/app/schemas/finance.py` | `transactions`, `categories` | `/api/v1/transactions` | Task 4, 8 |
| 추천 예산 생성 | `frontend/src/features/onboarding/OnboardingPage.tsx`, `frontend/src/features/budgets/BudgetPage.tsx` | `backend/app/services/budget_service.py`, `backend/app/routers/budgets.py` | `budgets`, `budget_items`, `income_entries`, `transactions` | `POST /api/v1/budgets/recommend` | Task 5, 7, 8 |
| 사용자 예산 조정 | `frontend/src/features/budgets/BudgetPage.tsx` | `backend/app/routers/budgets.py`, `backend/app/repositories/finance_repository.py` | `budgets`, `budget_items` | `PUT /api/v1/budgets/{period}` | Task 5, 8 |
| 실제 수입 감소 보정 | `frontend/src/features/income/IncomePage.tsx`, `frontend/src/features/budgets/BudgetPage.tsx` | `backend/app/services/budget_service.py`, `backend/app/routers/budgets.py` | `income_entries`, `budgets`, `budget_items` | `POST /api/v1/budgets/{period}/apply-actual-income` | Task 5, 8 |
| 대시보드 요약 | `frontend/src/features/dashboard/DashboardPage.tsx`, `frontend/src/components/common/AppCard.tsx`, `MoneyText.tsx` | `backend/app/services/analytics_service.py`, `backend/app/routers/analytics.py` | 수입·거래·예산 집계 | `GET /api/v1/analytics/dashboard` | Task 6, 8 |
| 월별 소비 그래프 | `frontend/src/features/dashboard/SpendingChart.tsx`, `frontend/src/features/analytics/AnalyticsPage.tsx` | `backend/app/services/analytics_service.py`, `backend/app/routers/analytics.py` | `transactions` 월별 집계 | `GET /api/v1/analytics/monthly` | Task 6, 8 |
| 카테고리별 소비 분석 | `frontend/src/features/analytics/AnalyticsPage.tsx` | `backend/app/services/analytics_service.py`, `backend/app/routers/analytics.py` | `transactions`, `categories` | `GET /api/v1/analytics/categories` | Task 6, 8 |
| 제한형 AI 소비 설명 | 대시보드 인사이트 영역, 후속 분리 시 `frontend/src/features/dashboard/InsightPanel.tsx` | `backend/app/services/insight_service.py`, `backend/app/routers/analytics.py` | `ai_insights`, OpenAI API 선택 사용 | `POST /api/v1/analytics/insights` | Task 6, 8 |
| 월간 리포트·PDF | `frontend/src/features/reports/ReportsPage.tsx` | `backend/app/services/report_service.py`, `backend/app/routers/reports.py` | `monthly_reports`, Supabase private Storage | `/api/v1/reports` | Task 9 |
| 데스크톱 사이드바·레이아웃 | `frontend/src/layouts/DesktopLayout.tsx`, `frontend/src/components/desktop/DesktopSidebar.tsx` | 해당 없음 | React Router | 해당 없음 | Task 7 |
| 좁은 데스크톱·태블릿 깨짐 방지 | `frontend/src/styles/global.css`, 각 페이지 CSS | 해당 없음 | 768px 이상 검수 | 해당 없음 | Task 7, 8, 10 |
| 모바일 전용 UI | 후속 `frontend/src/components/mobile/`, 후속 모바일 레이아웃 | 기존 FastAPI 재사용 | 기존 테이블 재사용 | 기존 API 재사용 | 현재 MVP 제외 |
| 사용자별 데이터 보호 | `frontend/src/api/client.ts`, `ProtectedRoute.tsx` | `backend/app/core/security.py`, `backend/app/dependencies.py`, 모든 Repository | Supabase RLS, JWT `sub` | 모든 보호 API | Task 2, 3, 10 |
| 자동화 테스트·시연 | `frontend/e2e/mypace-demo.spec.ts`, 각 `*.test.tsx` | `backend/tests/*.py` | 직장인·대학생 합성 데이터 | 전체 사용자 흐름 | Task 1~10 |

### 공통 연결 규칙

- 프런트엔드 페이지는 `frontend/src/api/client.ts`를 통해서만 FastAPI를 호출한다.
- FastAPI Router는 `backend/app/schemas/finance.py`로 요청·응답을 검증한다.
- Router는 계산을 직접 수행하지 않고 `services/`의 함수를 호출한다.
- 데이터 조회·저장은 `repositories/finance_repository.py`로 제한한다.
- 모든 보호 Router는 `backend/app/dependencies.py`의 `get_current_user()`를 사용한다.
- 테이블 변경은 SQLAlchemy 모델과 Alembic migration을 함께 수정한다.
- UI 데이터 타입이 변경되면 `frontend/src/types/api.ts`와 대응 Pydantic Schema를 동시에 검토한다.
- 기능별 테스트는 표에 연결된 백엔드 테스트와 프런트엔드 테스트를 함께 실행한다.

---

### Task 1: Workspace, FastAPI Health Check, and React Shell

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `backend/requirements.txt`
- Create: `backend/app/core/config.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/test_health.py`
- Create: `frontend/package.json` and Vite-generated configuration files
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles/global.css`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: none
- Produces: `app: FastAPI`, `GET /health -> {"status": "ok"}`, React `App()` shell, shared development commands

- [ ] **Step 1: Initialize Git and create ignore rules**

Create `.gitignore`:

```gitignore
.env
.env.*
!.env.example
__pycache__/
.pytest_cache/
.ruff_cache/
.venv/
node_modules/
dist/
coverage/
*.pyc
*.db
*.sqlite3
```

Run:

```powershell
cd 'D:\Personal project\MyPace'
git init
```

Expected: an empty Git repository is initialized without changing the parent directory.

Create `README.md`:

```markdown
# MyPace

내 수입에 맞춰, 소비도 마이페이스.

React 데스크톱 웹과 FastAPI로 만드는 개인 재무관리 MVP다. 실제 금융기관 대신 합성 거래 데이터를 사용하며 투자 상담 기능을 제공하지 않는다.

## Project status

Product design approved; implementation in progress.
```

- [ ] **Step 2: Write the failing FastAPI health test**

Create `backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Install backend dependencies and verify the test fails**

Create `backend/requirements.txt`:

```text
fastapi
uvicorn[standard]
pydantic-settings
sqlalchemy
psycopg[binary]
alembic
pyjwt[crypto]
httpx
python-multipart
reportlab
openai
pytest
pytest-cov
```

Run:

```powershell
cd 'D:\Personal project\MyPace\backend'
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m pytest tests/test_health.py -v
```

Expected: FAIL because `app.main` does not exist.

- [ ] **Step 4: Implement settings and the FastAPI app**

Create `backend/app/core/config.py`:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MyPace API"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./mypace.db"
    supabase_url: str = ""
    supabase_jwt_issuer: str = ""
    openai_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

Run: `.\.venv\Scripts\python -m pytest tests/test_health.py -v`

Expected: PASS.

- [ ] **Step 5: Initialize React and write the failing shell test**

Run:

```powershell
cd 'D:\Personal project\MyPace'
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom @tanstack/react-query @supabase/supabase-js chart.js react-chartjs-2
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Add `"test": "vitest"` to `frontend/package.json` scripts. Replace `frontend/vite.config.ts` with:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `frontend/src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Create `frontend/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows the MyPace identity", () => {
    render(<App />);
    expect(screen.getByText("MyPace")).toBeInTheDocument();
    expect(screen.getByText("내 수입에 맞춰, 소비도 마이페이스")).toBeInTheDocument();
  });
});
```

Run: `npm test -- --run src/App.test.tsx`

Expected: FAIL until the starter component is replaced.

- [ ] **Step 6: Implement the React shell and base design tokens**

Create `frontend/src/App.tsx`:

```tsx
import "./styles/global.css";

export default function App() {
  return (
    <main className="welcome-shell">
      <p className="brand">MyPace</p>
      <h1>내 수입에 맞춰, 소비도 마이페이스</h1>
    </main>
  );
}
```

Create `frontend/src/styles/global.css`:

```css
:root {
  font-family: Pretendard, "Noto Sans KR", system-ui, sans-serif;
  color: #17253f;
  background: #f8f6ef;
  --color-primary: #173b68;
  --color-accent: #62c6ae;
  --color-surface: #ffffff;
  --color-border: #dfe5e2;
  --color-warning: #b77818;
  --color-danger: #b64a4a;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input, select { font: inherit; }
.welcome-shell { max-width: 1180px; margin: 0 auto; padding: 48px 32px; }
.brand { color: var(--color-primary); font-weight: 700; }
@media (max-width: 900px) { .welcome-shell { padding: 32px 20px; } }
```

Run: `npm test -- --run src/App.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the independently runnable shell**

```powershell
git add .gitignore README.md backend frontend
git commit -m "chore: initialize MyPace React and FastAPI workspace"
```

---

### Task 2: Supabase Schema, SQLAlchemy Models, and RLS

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`
- Create: `backend/app/database.py`
- Create: `backend/app/models/entities.py`
- Create: `backend/alembic.ini`
- Create: `backend/migrations/env.py`
- Create: `backend/migrations/versions/0001_initial_schema.py`
- Create: `backend/tests/test_models.py`

**Interfaces:**
- Consumes: `Settings.database_url`
- Produces: `Base`, `SessionLocal`, `get_db()`, UUID-keyed finance tables, RLS SQL migration

- [ ] **Step 1: Define environment variable contracts**

Create `backend/.env.example`:

```dotenv
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql+psycopg://postgres.PROJECT_REF:PASSWORD@HOST:6543/postgres
SUPABASE_URL=https://rdhnynswyxhczqummtxc.supabase.co
SUPABASE_JWT_ISSUER=https://rdhnynswyxhczqummtxc.supabase.co/auth/v1
OPENAI_API_KEY=
```

Create `frontend/.env.example`:

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://rdhnynswyxhczqummtxc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The database password and publishable key must be copied locally from the Supabase dashboard and never committed.

- [ ] **Step 2: Write the failing model metadata test**

Create `backend/tests/test_models.py`:

```python
from app.models.entities import Base


def test_required_tables_are_registered() -> None:
    assert set(Base.metadata.tables) >= {
        "profiles",
        "income_sources",
        "income_entries",
        "financial_accounts",
        "categories",
        "transactions",
        "budgets",
        "budget_items",
        "ai_insights",
        "monthly_reports",
    }
```

Run: `python -m pytest tests/test_models.py -v`

Expected: FAIL because the model module does not exist.

- [ ] **Step 3: Implement database session and focused models**

Create `backend/app/database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

engine = create_engine(get_settings().database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Create `backend/app/models/entities.py` with SQLAlchemy 2.0 `Mapped` models. Use UUID primary keys, `Numeric(14, 2)` for money, `Date` for periods, timezone-aware timestamps, explicit foreign keys, and indexes on `(user_id, period)` and `(user_id, occurred_at)`. Define the ten table names asserted by the test, with `user_id: Mapped[UUID]` on every user-owned root table and cascade relationships only from parent to owned children.

Run: `python -m pytest tests/test_models.py -v`

Expected: PASS with all ten tables registered.

- [ ] **Step 4: Create the Alembic migration with automatic RLS-compatible policies**

Generate the migration:

```powershell
cd 'D:\Personal project\MyPace\backend'
.\.venv\Scripts\alembic init migrations
.\.venv\Scripts\alembic revision --autogenerate -m "create MyPace schema"
```

Append explicit SQL for each user-owned table in `upgrade()`:

```python
for table in USER_OWNED_TABLES:
    op.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY')
    op.execute(
        f'''CREATE POLICY "{table}_owner_all" ON public."{table}"
            FOR ALL TO authenticated
            USING ((select auth.uid()) = user_id)
            WITH CHECK ((select auth.uid()) = user_id)'''
    )
```

For `budget_items`, enforce access through its parent budget with an `EXISTS` policy rather than adding a duplicated user ID. Verify the generated downgrade drops policies before tables.

- [ ] **Step 5: Apply the migration to Supabase and verify RLS**

Run:

```powershell
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\alembic current
```

Expected: the current revision is `0001`, all tables appear in Supabase Table Editor, and each user table shows RLS enabled.

- [ ] **Step 6: Commit the database foundation**

```powershell
git add backend frontend/.env.example
git commit -m "feat: add Supabase schema and row level security"
```

---

### Task 3: Supabase JWT Verification and Protected Profile API

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/app/dependencies.py`
- Create: `backend/app/schemas/finance.py`
- Create: `backend/app/repositories/finance_repository.py`
- Create: `backend/app/routers/profile.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_auth.py`
- Create: `frontend/src/lib/supabase.ts`
- Create: `frontend/src/features/auth/AuthProvider.tsx`
- Create: `frontend/src/features/auth/ProtectedRoute.tsx`
- Create: `frontend/src/features/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: Supabase JWT issuer and JWKS endpoint
- Produces: `CurrentUser(user_id: UUID, email: str | None)`, `get_current_user()`, protected `/api/v1/profile`, React auth context

- [ ] **Step 1: Write failing JWT dependency tests**

Create tests that override `get_current_user` in FastAPI and assert: no authorization header returns 401; an injected user can read their profile; request JSON cannot select another `user_id`.

```python
def test_profile_requires_bearer_token(client):
    response = client.get("/api/v1/profile")
    assert response.status_code == 401
```

Run: `python -m pytest tests/test_auth.py -v`

Expected: FAIL because the router and dependency do not exist.

- [ ] **Step 2: Implement verified Supabase JWT parsing**

In `backend/app/core/security.py`, implement `SupabaseTokenVerifier.verify(token: str) -> CurrentUser` using `PyJWKClient(f"{supabase_url}/auth/v1/.well-known/jwks.json")`, `jwt.decode`, expected issuer, expiration validation, and UUID conversion of `sub`. Raise `HTTPException(401, "유효하지 않거나 만료된 로그인입니다.")` for missing or invalid claims.

In `backend/app/dependencies.py`, use `HTTPBearer(auto_error=False)` and return only the verified `CurrentUser`. Never accept a user ID parameter from request data.

- [ ] **Step 3: Implement profile schemas, repository, and router**

Define:

```python
class ProfileUpsert(BaseModel):
    display_name: str = Field(min_length=1, max_length=40)
    user_type: Literal["worker", "student"]


class ProfileResponse(ProfileUpsert):
    user_id: UUID
    model_config = ConfigDict(from_attributes=True)
```

Expose `GET /api/v1/profile` and `PUT /api/v1/profile`. Both receive `current_user: CurrentUser = Depends(get_current_user)` and scope the repository query to `current_user.user_id`.

Run: `python -m pytest tests/test_auth.py -v`

Expected: PASS.

- [ ] **Step 4: Configure Supabase Auth in React**

Create `frontend/src/lib/supabase.ts` with `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)`. Implement `AuthProvider` using `getSession()` and `onAuthStateChange()`. Implement `ProtectedRoute` that renders a loading state, redirects unauthenticated users to `/login`, and otherwise renders an `<Outlet />`.

`LoginPage` must provide email sign-in, email sign-up, and:

```typescript
await supabase.auth.signInWithOAuth({
  provider: "kakao",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

- [ ] **Step 5: Verify authentication boundaries**

Run:

```powershell
python -m pytest tests/test_auth.py -v
cd ..\frontend
npm test -- --run
```

Expected: backend protection tests and frontend auth component tests PASS.

- [ ] **Step 6: Commit authentication**

```powershell
git add backend frontend
git commit -m "feat: add Supabase authentication boundary"
```

---

### Task 4: Income, Transaction, and Mock Banking APIs

**Files:**
- Modify: `backend/app/schemas/finance.py`
- Modify: `backend/app/repositories/finance_repository.py`
- Create: `backend/app/routers/incomes.py`
- Create: `backend/app/routers/transactions.py`
- Create: `backend/app/routers/mock_banking.py`
- Create: `backend/scripts/seed_demo.py`
- Create: `backend/tests/test_transactions_api.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: authenticated `CurrentUser`, SQLAlchemy session
- Produces: CRUD endpoints for 예상 수입·실제 수입과 거래, 직장인(worker)·대학생(student)용 결정적 합성 거래

- [ ] **Step 1: Write failing transaction ownership tests**

Test that creating a transaction always assigns the token user, listing returns only that user's rows, negative or zero amounts return 422, and deleting another user's transaction returns 404.

```python
def test_transaction_amount_must_be_positive(client, auth_override):
    response = client.post(
        "/api/v1/transactions",
        json={"amount": 0, "kind": "expense", "occurred_at": "2026-07-03"},
    )
    assert response.status_code == 422
```

Run: `python -m pytest tests/test_transactions_api.py -v`

Expected: FAIL because the endpoint is missing.

- [ ] **Step 2: Add validated schemas**

Define `IncomeEntryCreate`, `IncomeEntryResponse`, `TransactionCreate`, `TransactionUpdate`, `TransactionResponse`, and `TransactionListResponse`. Money fields use `Decimal` with `gt=0`; `kind` is `Literal["income", "expense"]`; dates use `date`; descriptions are capped at 120 characters.

- [ ] **Step 3: Implement user-scoped repositories and routers**

Every repository signature includes `user_id: UUID`, for example:

```python
def list_transactions(
    self,
    user_id: UUID,
    start: date | None,
    end: date | None,
) -> list[Transaction]:
    statement = select(Transaction).where(Transaction.user_id == user_id)
    if start:
        statement = statement.where(Transaction.occurred_at >= start)
    if end:
        statement = statement.where(Transaction.occurred_at <= end)
    return list(self.db.scalars(statement.order_by(Transaction.occurred_at.desc())))
```

Expose CRUD endpoints under `/api/v1/incomes` and `/api/v1/transactions`. Return 404 instead of revealing that another user's record exists.

- [ ] **Step 4: Implement deterministic mock banking imports**

Create fixed worker and student transaction generators whose output depends only on persona and target month. `POST /api/v1/mock-banking/import?persona=worker&period=2026-07` inserts rows only when the same demo external ID does not exist, making repeated imports idempotent.

- [ ] **Step 5: Run API tests and import the demo data locally**

Run:

```powershell
python -m pytest tests/test_transactions_api.py -v
python scripts/seed_demo.py --persona worker --period 2026-07
python scripts/seed_demo.py --persona student --period 2026-07
```

Expected: tests PASS and each persona receives repeatable income and expense rows without duplicates.

- [ ] **Step 6: Commit finance data management**

```powershell
git add backend
git commit -m "feat: add income transactions and demo banking data"
```

---

### Task 5: Deterministic Budget Recommendation and Actual-Income Recalculation

**Files:**
- Create: `backend/app/services/budget_service.py`
- Create: `backend/app/routers/budgets.py`
- Modify: `backend/app/schemas/finance.py`
- Modify: `backend/app/repositories/finance_repository.py`
- Create: `backend/tests/test_budget_service.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: expected income, actual income, fixed expenses, category history, elapsed spending
- Produces: `BudgetRecommendation`, `recalculate_after_actual_income()`, `/api/v1/budgets/recommend`, `/api/v1/budgets/{period}`

- [ ] **Step 1: Write failing budget rule tests**

Cover worker and student initial recommendations, rounding, category sum equality, actual income lower than expected, preservation of spent and required money, reduction of discretionary categories first, and daily allowance with zero remaining days.

```python
def test_lower_actual_income_reduces_discretionary_first():
    result = recalculate_after_actual_income(
        expected_income=Decimal("2350000"),
        actual_income=Decimal("2300000"),
        spent=Decimal("900000"),
        remaining_required=Decimal("800000"),
        remaining_savings=Decimal("300000"),
        remaining_discretionary=Decimal("350000"),
        remaining_days=10,
    )
    assert result.adjusted_discretionary == Decimal("300000")
    assert result.daily_available == Decimal("30000")
```

Run: `python -m pytest tests/test_budget_service.py -v`

Expected: FAIL because the service is absent.

- [ ] **Step 2: Implement pure Decimal-based budget functions**

Implement frozen dataclasses or Pydantic models for `BudgetRecommendation` and `ActualIncomeAdjustment`. Use `Decimal`, quantize to whole won, reject negative inputs, and keep calculation free of database or OpenAI calls.

Allocation order:

1. fixed/required amounts from user input;
2. savings target bounded by remaining income;
3. category history-weighted discretionary allocation;
4. any remainder assigned to reserve;
5. when actual income is lower, reduce reserve then discretionary then savings, never reduce money already spent.

- [ ] **Step 3: Expose recommendation and adjustment endpoints**

`POST /api/v1/budgets/recommend` reads the authenticated user's income and history, calls the pure service, and returns recommended items without persisting. `PUT /api/v1/budgets/{period}` validates adjusted item totals against base income and persists the user's accepted version. `POST /api/v1/budgets/{period}/apply-actual-income` returns before/after values and reasons.

- [ ] **Step 4: Verify budget invariants**

Run: `python -m pytest tests/test_budget_service.py -v`

Expected: all recommendation totals equal base income; lower actual income cannot produce negative remaining money; tests PASS.

- [ ] **Step 5: Commit the budget engine**

```powershell
git add backend
git commit -m "feat: add deterministic budget recommendation engine"
```

---

### Task 6: Spending Analytics and Safe AI Explanations

**Files:**
- Create: `backend/app/services/analytics_service.py`
- Create: `backend/app/services/insight_service.py`
- Create: `backend/app/routers/analytics.py`
- Create: `backend/tests/test_analytics_service.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: monthly income, transaction aggregates, accepted budget
- Produces: `MonthlyAnalytics`, deterministic insight evidence, optional natural-language explanation

- [ ] **Step 1: Write failing analytics tests**

Test spending rate, budget usage, remaining living money, daily availability, prior-month change, category change, and less-than-two-month fallback.

```python
def test_spending_rate_uses_actual_income():
    result = calculate_monthly_analytics(
        actual_income=Decimal("2000000"),
        total_expense=Decimal("1000000"),
        budget_total=Decimal("1800000"),
        remaining_days=10,
    )
    assert result.spending_rate == Decimal("50.00")
    assert result.remaining_budget == Decimal("800000")
```

Run: `python -m pytest tests/test_analytics_service.py -v`

Expected: FAIL because the calculation function is absent.

- [ ] **Step 2: Implement deterministic analytics**

Use Decimal percentage helpers with explicit zero-income behavior. Return `comparison_available=False` when fewer than two complete months exist. Mark a category as materially changed only when both the absolute difference and percentage threshold are met, preventing tiny amounts from producing alarming messages.

- [ ] **Step 3: Implement the insight boundary**

Define an `InsightEvidence` model containing period, metric name, current value, comparison value, change percentage, and safe category label. `InsightService.explain(evidence)` sends only this model to OpenAI. Set a short timeout; on API error return a deterministic Korean template such as `"이번 달 카페 지출이 지난달보다 27% 증가했습니다."`.

The prompt must state: do not give investment, loan, tax, or legal advice; do not invent values; use only the evidence; produce at most three short sentences.

- [ ] **Step 4: Expose analytics endpoints**

Implement:

```text
GET /api/v1/analytics/dashboard?period=2026-07
GET /api/v1/analytics/monthly?from=2026-02&to=2026-07
GET /api/v1/analytics/categories?period=2026-07
POST /api/v1/analytics/insights?period=2026-07
```

The first three must not call OpenAI. The insight endpoint may call it and must retain the deterministic fallback.

- [ ] **Step 5: Run analytics tests with the OpenAI key unset**

Run: `python -m pytest tests/test_analytics_service.py -v`

Expected: PASS and the fallback insight remains available without an OpenAI key.

- [ ] **Step 6: Commit analytics and AI boundary**

```powershell
git add backend
git commit -m "feat: add spending analytics and safe insight explanations"
```

---

### Task 7: Desktop Authentication, Onboarding, and Application Layout

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/layouts/DesktopLayout.tsx`
- Create: `frontend/src/components/desktop/DesktopSidebar.tsx`
- Create: `frontend/src/features/onboarding/OnboardingPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles/global.css`
- Create: `frontend/src/features/onboarding/OnboardingPage.test.tsx`

**Interfaces:**
- Consumes: Supabase session, `/profile`, `/incomes`, `/budgets/recommend`
- Produces: authenticated desktop routing, access-token API client, completed onboarding flow

- [ ] **Step 1: Write failing onboarding behavior tests**

Test that the user selects exactly one type, cannot continue without expected income, sees a recommendation after successful submission, and can adjust before saving.

Run: `npm test -- --run src/features/onboarding/OnboardingPage.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 2: Implement the authenticated API client**

Create `frontend/src/api/client.ts`:

```typescript
import { supabase } from "../lib/supabase";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({ detail: "요청에 실패했습니다." }));
    throw new Error(problem.detail ?? "요청에 실패했습니다.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
```

- [ ] **Step 3: Implement desktop routing and layout**

Routes:

```text
/login
/onboarding
/dashboard
/incomes
/transactions
/budgets
/analytics
/reports
```

`DesktopLayout` uses a 220px sidebar and flexible content column. At widths below 900px, reduce sidebar width and content padding; do not implement bottom navigation. Ensure horizontal overflow is prevented and forms remain usable.

- [ ] **Step 4: Implement onboarding**

Build four steps: user type, income sources, fixed expenses, recommendation review. Persist profile and income before requesting a recommendation. Display loading, validation, API error, and success states with visible Korean messages.

- [ ] **Step 5: Verify UI tests and keyboard flow**

Run:

```powershell
npm test -- --run
npm run build
```

Expected: tests PASS, TypeScript compilation succeeds, and the build completes without overflow-related runtime warnings.

- [ ] **Step 6: Commit authenticated desktop flow**

```powershell
git add frontend
git commit -m "feat: add desktop authentication and onboarding flow"
```

---

### Task 8: Dashboard, Transactions, Budget, and Analytics Pages

**Files:**
- Create: `frontend/src/components/common/AppCard.tsx`
- Create: `frontend/src/components/common/MoneyText.tsx`
- Create: `frontend/src/components/common/PageState.tsx`
- Create: `frontend/src/components/desktop/TransactionTable.tsx`
- Create: `frontend/src/features/dashboard/DashboardPage.tsx`
- Create: `frontend/src/features/dashboard/SpendingChart.tsx`
- Create: `frontend/src/features/income/IncomePage.tsx`
- Create: `frontend/src/features/transactions/TransactionsPage.tsx`
- Create: `frontend/src/features/budgets/BudgetPage.tsx`
- Create: `frontend/src/features/analytics/AnalyticsPage.tsx`
- Create: `frontend/src/features/dashboard/DashboardPage.test.tsx`
- Modify: `frontend/src/styles/global.css`

**Interfaces:**
- Consumes: Task 4–6 APIs and Task 7 layout/client
- Produces: complete desktop finance workflow matching the approved MyPace visual concept

- [ ] **Step 1: Write failing dashboard contract tests**

Mock the dashboard API and assert that income, remaining living money, budget usage, monthly chart, recommended budgets, and one insight render. Add an error test that shows retry without blanking the navigation.

Run: `npm test -- --run src/features/dashboard/DashboardPage.test.tsx`

Expected: FAIL because the dashboard page does not exist.

- [ ] **Step 2: Implement shared visual components**

`MoneyText` formats with `Intl.NumberFormat("ko-KR")` and always appends `원`. `PageState` handles loading, empty, and error states. `AppCard` provides one consistent surface; avoid nested cards.

- [ ] **Step 3: Implement the approved dashboard design**

Use the approved ivory background, deep-blue navigation/action color, and mint status accent. Place the three summary cards first, monthly spending chart in the main column, recommended budget list below, and MyPace insight panel in the right column. At narrower desktop widths, move the insight below the chart without hiding content.

- [ ] **Step 4: Implement income and transaction management**

Income page supports expected and actual amounts. Transactions page provides date/category/account filters, table, add/edit dialog, delete confirmation, and demo import. Preserve filters in URL search parameters. Never expose database IDs as editable user ID fields.

- [ ] **Step 5: Implement budget adjustment and analysis pages**

Budget page shows expected versus actual income, recommended versus adjusted amount, used and remaining amount, total validation, and actual-income recalculation comparison. Analytics page displays monthly consumption, category shares, spending-rate change, and accessible chart summaries.

- [ ] **Step 6: Run unit tests and production build**

Run:

```powershell
npm test -- --run
npm run build
```

Expected: all component tests PASS and the Vite production build succeeds.

- [ ] **Step 7: Commit the desktop product experience**

```powershell
git add frontend
git commit -m "feat: add MyPace desktop finance dashboard"
```

---

### Task 9: Monthly PDF Report and Private Download

**Files:**
- Create: `backend/app/services/report_service.py`
- Create: `backend/app/routers/reports.py`
- Create: `backend/tests/test_report_service.py`
- Create: `frontend/src/features/reports/ReportsPage.tsx`
- Modify: `backend/app/main.py`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: monthly analytics, budget comparison, safe insight text
- Produces: PDF bytes, private report metadata, short-lived user download URL, report page

- [ ] **Step 1: Write the failing PDF content test**

Generate a report with known values, read it using `pypdf`, and assert that it contains MyPace, period, total income, total spending, and next-month recommendation. Assert a different user cannot request its download URL.

Run: `python -m pytest tests/test_report_service.py -v`

Expected: FAIL because the report service does not exist.

- [ ] **Step 2: Implement in-memory PDF generation**

Use ReportLab `BytesIO`, registered Korean font asset, consistent headings, summary table, category table, and insight paragraph. `build_monthly_report(data: MonthlyReportData) -> bytes` must not access the network or database.

- [ ] **Step 3: Implement private storage and endpoints**

Store files under `${user_id}/${period}/${report_id}.pdf` in a private Supabase Storage bucket. Implement:

```text
POST /api/v1/reports/{period}
GET /api/v1/reports/{period}
POST /api/v1/reports/{report_id}/download-url
```

The signed URL expires after 60 seconds. Verify ownership before generating it.

- [ ] **Step 4: Implement the report page**

Show report summary, generation time, major insight, and a clear PDF download button. Disable repeated generation while a request is pending and surface download expiration errors with a retry action.

- [ ] **Step 5: Run backend and frontend tests**

Run:

```powershell
cd 'D:\Personal project\MyPace\backend'
python -m pytest tests/test_report_service.py -v
cd ..\frontend
npm test -- --run
```

Expected: PDF content, ownership, and report page tests PASS.

- [ ] **Step 6: Commit reports**

```powershell
git add backend frontend
git commit -m "feat: add private monthly PDF reports"
```

---

### Task 10: End-to-End Demo, Security Review, and Release Documentation

**Files:**
- Create: `frontend/e2e/mypace-demo.spec.ts`
- Create: `frontend/playwright.config.ts`
- Modify: `README.md`
- Modify: `docs/mypace-product-design.md`
- Create: `docs/demo-script.md`

**Interfaces:**
- Consumes: all previous tasks
- Produces: repeatable worker/student demos, verified desktop release, documented setup and limitations

- [ ] **Step 1: Write the end-to-end worker scenario**

Automate: 직장인 테스트 사용자 로그인, 온보딩, 예상 수입 입력, worker 합성 데이터 가져오기, 대시보드 확인, 더 적은 실제 수입 입력, 재계산 승인, 분석 확인, 리포트 생성을 수행한다. Use stable roles and labels rather than CSS selectors.

- [ ] **Step 2: Write the end-to-end student scenario**

Automate: 대학생 테스트 사용자 로그인, 변동 아르바이트 예상 수입과 실제 수입 입력, student 합성 데이터 가져오기, 남은 생활비와 지출률 변화 확인, 카페 소비 인사이트 확인을 수행한다.

- [ ] **Step 3: Run all automated checks**

Run:

```powershell
cd 'D:\Personal project\MyPace\backend'
python -m pytest --cov=app --cov-report=term-missing
cd ..\frontend
npm test -- --run
npm run build
npx playwright test
```

Expected: backend, frontend, build, worker E2E, and student E2E checks all PASS.

- [ ] **Step 4: Perform the security checklist**

Run repository searches and confirm zero secret matches:

```powershell
rg -n "service_role|postgresql\+psycopg://.*:.*@|OPENAI_API_KEY=sk-" .
rg -n "user_id.*(body|payload|request)" backend/app
```

Expected: no committed secrets and no authorization based on request-supplied user IDs. Manually verify RLS is enabled on all user tables, the Storage bucket is private, CORS contains only the configured frontend origin, and logs omit authorization headers.

- [ ] **Step 5: Verify desktop responsive acceptance**

Inspect the full flow at 1440×900, 1280×800, 1024×768, and 768×1024. Confirm no horizontal page scrolling, clipped labels, overlapping cards, unreachable dialogs, or chart labels outside their area. Record 767px-and-below mobile UX as a documented later phase, not a failed MVP requirement.

- [ ] **Step 6: Complete setup and demo documentation**

README must include prerequisites, folder structure, local setup, environment variable names, Supabase migration, Kakao redirect URI, start commands, test commands, demo users, security rules, synthetic-data disclosure, AI limitations, and mobile deferral. `docs/demo-script.md` must provide the worker and student scripts with expected screen results.

- [ ] **Step 7: Run the final verification again after documentation changes**

Run the complete command set from Step 3.

Expected: every check remains PASS with a clean `git status` except the intended documentation changes.

- [ ] **Step 8: Commit the release candidate**

```powershell
git add README.md docs frontend/e2e frontend/playwright.config.ts
git commit -m "docs: finalize MyPace MVP demo and release checks"
```

---

## Four-Week Schedule

### Week 1 — Foundation and Security

- Task 1: workspace and health checks
- Task 2: Supabase schema, SQLAlchemy, Alembic, RLS
- Task 3: authentication and profile boundary

### Week 2 — Finance Domain

- Task 4: income, transactions, synthetic banking
- Task 5: deterministic budget engine
- Task 6: analytics and safe AI explanations

### Week 3 — Approved Desktop UI

- Task 7: auth, onboarding, and desktop layout
- Task 8: dashboard, transaction, budget, analytics pages

### Week 4 — Reporting and Stabilization

- Task 9: monthly PDF
- Task 10: E2E, security review, documentation, demo rehearsal

## Two-Week Compression

Maintain Tasks 1–5 and the desktop portions of Tasks 7–8. In Task 6 keep deterministic analytics but use template insights without OpenAI. Replace Task 9 PDF storage with an on-demand local download, and shorten Task 10 to one worker E2E plus manual student verification.

The following remain mandatory even in two weeks:

- Supabase authentication and RLS
- authenticated FastAPI boundary
- expected and actual income
- transaction entry and synthetic data
- budget recommendation and lower-income recalculation
- desktop dashboard and spending analysis
- no real financial data
- secret scanning and ownership tests

## Execution Checkpoints

- Checkpoint A after Task 3: authentication and data isolation review
- Checkpoint B after Task 6: calculation rule and API contract review
- Checkpoint C after Task 8: visual and desktop responsive review
- Checkpoint D after Task 10: final security and demo acceptance
