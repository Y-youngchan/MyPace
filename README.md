# MyPace

내 수입에 맞춰, 소비도 마이페이스.

수입을 기준으로 예산, 거래, 카테고리, 캘린더, 분석, 리포트를 연결하는 개인 재무 관리 웹 서비스입니다.

## 프로젝트 상태

포트폴리오용 MVP 구현 단계입니다. 실 금융기관 연동은 아직 포함하지 않고, 사용자가 직접 입력한 수입/거래 데이터를 기준으로 화면을 구성합니다.

## 서비스 흐름

MyPace는 사용자가 직접 입력한 수입을 기준으로 한 달 예산을 만들고, 거래내역이 쌓이면 예산 사용률과 분석/리포트를 자동으로 보여주는 구조입니다.

```txt
로그인/회원가입
  → 수입 입력
  → 예산 비율 조정 및 저장
  → 거래 추가
  → 카테고리별 사용률 확인
  → 분석/리포트 확인
```

예산은 `고정비`, `생활비`, `저축`, `여유금`으로 나누고, 거래 카테고리의 고정비/변동비 속성을 기준으로 사용률에 반영합니다.

## 주요 기능

- Supabase 이메일/구글/카카오 인증 기반 로그인
- 이메일 회원가입 및 추가 프로필 입력
- 수입 등록
- 예산 비율 조정 및 확정 저장
- 거래 추가/수정
- 기본 카테고리 자동 생성 및 사용자 카테고리 추가
- 고정비/변동비 기준 카테고리 분석
- 캘린더 일정 확인
- 월간 분석/리포트
- 프로필 확인 및 닉네임/비밀번호 변경 흐름

## 현재 구현된 주요 화면

- `/login`: 로그인
- `/signup`: 이메일 회원가입
- `/dashboard`: 대시보드
- `/income`: 수입
- `/budgets`: 예산
- `/transactions`: 거래내역
- `/categories`: 카테고리
- `/calendar`: 캘린더
- `/analytics`: 분석
- `/reports`: 리포트
- `/profile`: 프로필

## 기술 스택

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic
- Auth/DB: Supabase Auth, Supabase PostgreSQL
- Test: Vitest, React Testing Library, Pytest

## 폴더 구조

```txt
MyPace/
  backend/    FastAPI API 서버, DB 모델, 마이그레이션, 백엔드 테스트
  frontend/   React 화면, 라우팅, Supabase 로그인, 프론트 테스트
```

## 로컬 실행

### 1. 백엔드 실행

```bash
cd "/Users/yycmac/Desktop/코드개발/Personal project/MyPace/backend"
source .venv/bin/activate
PYTHONPATH=. alembic upgrade head
python -m uvicorn app.main:app --reload
```

백엔드 주소:

```txt
http://127.0.0.1:8000
```

### 2. 프론트엔드 실행

Mac에 `node`/`npm`이 전역 설치되어 있지 않은 경우, Codex 런타임 경로를 앞에 붙여 실행합니다.

```bash
cd "/Users/yycmac/Desktop/코드개발/Personal project/MyPace/frontend"
PATH="/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm dev
```

프론트엔드 주소:

```txt
http://localhost:5173
```

## 환경변수

실제 값은 `.env`에 넣고, `.env`는 Git에 올리지 않습니다.

템플릿 파일:

- `backend/.env.example`
- `frontend/.env.example`

백엔드 주요 값:

```ini
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql+psycopg://...
SUPABASE_URL=https://프로젝트_REF.supabase.co
SUPABASE_JWT_ISSUER=https://프로젝트_REF.supabase.co/auth/v1
SUPABASE_PUBLISHABLE_KEY=
```

프론트엔드 주요 값:

```ini
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://프로젝트_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## 테스트

백엔드:

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest
```

프론트엔드:

```bash
cd frontend
PATH="/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm test --run
```

프론트 빌드:

```bash
cd frontend
PATH="/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/yycmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm build
```

## 배포 전 대청소 체크리스트

배포 직전에 아래 순서로 정리합니다.

- 사용하지 않는 더미 데이터/개발자용 우회 흐름 확인
- 로컬 확인용 문구와 포트폴리오 공개용 문구 분리
- 화면별 빈 상태/에러 상태 문구 확인
- 큰 페이지 파일 분리
- 반복되는 날짜/금액 계산 함수 공통화
- API 호출 로직 중복 정리
- 테스트 목데이터 정리
- `.env` 값 누락 여부 확인
- 전체 테스트 및 빌드 재검증
- 배포 URL을 포트폴리오 `프로젝트 확인하기` 버튼에 연결

## 주의

MyPace는 개인 지출 관리를 돕는 서비스이며 투자, 세무, 금융 자문을 제공하지 않습니다.
