# MyPace 프로젝트 인수인계

작성일: 2026-07-23  
현재 단계: 제품 설계와 구현 계획 완료, 실제 코드 구현 시작 전

## 1. 프로젝트 위치

기존 컴퓨터의 프로젝트 경로:

```text
D:\Personal project\MyPace
```

`Personal project`는 개인 프로젝트들을 보관하는 상위 폴더이므로 이름을 변경하지 않는다. 실제 서비스 프로젝트 루트는 그 안의 `MyPace`다.

다른 컴퓨터에서는 드라이브 문자가 달라도 되지만 다음 구조는 유지한다.

```text
Personal project/
└── MyPace/
    ├── backend/
    ├── frontend/
    └── docs/
```

## 2. 핵심 문서

다른 컴퓨터에서 작업을 시작하기 전에 아래 순서로 읽는다.

1. `docs/mypace-home-handoff.md` — 현재 상태와 재개 방법
2. `docs/mypace-product-design.md` — 서비스 기능, 디자인, 데이터와 보안 설계
3. `docs/mypace-implementation-plan.md` — Task별 파일, 테스트, API와 구현 순서

구현 계획의 `Feature-to-File Traceability` 표에는 각 기능이 연결되는 React 파일, FastAPI 파일, Supabase 테이블, API와 담당 Task가 정리되어 있다.

## 3. 서비스 개요

- 서비스명: MyPace
- 한글명: 마이페이스
- 슬로건: 내 수입에 맞춰, 소비도 마이페이스
- 한 줄 소개: 수입과 소비 흐름을 분석해 나만의 지출 속도와 맞춤 예산을 제안하는 AI 개인 재무관리 플랫폼

프로젝트의 중심은 투자 기능이 아니라 사용자의 수입에 맞는 지출과 생활비 관리다.

## 4. 대상 사용자

### 직장인

- 월 실수령액 직접 입력
- 급여 외 부업과 기타 수입 추가
- 고정지출, 생활비, 전월 대비 소비 강조

### 대학생

- 아르바이트 예상 수입과 실제 입금액 입력
- 용돈, 장학금과 기타 수입 추가
- 수입 변동성, 남은 생활비와 지출률 변화 강조

두 유형은 별도 애플리케이션으로 나누지 않는다. 공통 데이터와 기능을 사용하고 초기 설정과 강조 지표만 다르게 한다.

## 5. 확정 기능

- 이메일 회원가입·로그인·이메일 인증
- 카카오 OAuth 로그인
- 직장인·대학생 프로필
- 예상 수입과 실제 수입 관리
- 급여·아르바이트·부업·용돈 등 여러 수입원
- 시연용 은행 계좌·카드·현금 계정
- 합성 거래내역 불러오기
- 거래 직접 추가·수정·삭제
- 추천 예산 생성과 사용자 조정
- 실제 수입이 예상보다 적을 때 예산 재계산
- 총지출, 지출률, 예산 사용률, 남은 생활비
- 월별 소비와 카테고리별 소비 그래프
- 전월과 최근 평균 대비 소비 변화
- 제한형 AI 소비 설명
- 월간 리포트와 PDF 다운로드

## 6. 제외 기능

- 실제 오픈뱅킹·은행·카드사 API 연동
- 실계좌와 실제 카드번호 저장
- 송금과 결제
- 투자 분석과 투자 상담
- 대출 권유와 신용평가
- 네이티브 Android/iOS 앱
- 1차 MVP의 모바일 전용 UI

## 7. 화면과 디자인 방향

- 데스크톱 웹을 먼저 완성한다.
- React 기반 반응형 구조로 만들되 1차 MVP 검수 대상은 데스크톱이다.
- 768~1279px에서도 내용이 겹치거나 잘리지 않게 한다.
- 모바일 전용 하단 메뉴, 카드형 거래 목록과 바텀시트는 후속 구현이다.

디자인 콘셉트:

- 밝은 아이보리 배경
- 딥블루 중심색
- 안정·절약 상태의 민트 포인트
- 은행 앱보다 부드럽고 일반 가계부보다 전문적인 분위기
- 숫자, 현재 상태와 다음 행동을 우선 표시

승인된 대시보드 구성:

- 이번 달 수입
- 남은 생활비
- 예산 사용률
- 월별 소비 그래프
- 추천 예산 목록
- 우측 MyPace 소비 인사이트
- 데스크톱 좌측 사이드바

## 8. 확정 기술 방향

### 프런트엔드

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Chart.js
- Vitest와 Testing Library

### 백엔드

- FastAPI
- Pydantic 2
- SQLAlchemy 2
- Alembic
- psycopg 3
- pytest

백엔드 계층:

```text
Router → Service → Repository → Supabase PostgreSQL
```

### 데이터·인증

- Supabase PostgreSQL
- Supabase Auth
- 이메일 인증과 카카오 OAuth
- 모든 사용자 데이터에 Row Level Security 적용
- FastAPI에서도 JWT 사용자 ID로 소유권 재검사

### AI

- OpenAI API 후보
- AI는 계산하지 않고 FastAPI가 만든 근거를 설명
- API 실패 시 고정 문장 템플릿 사용
- 모델과 실제 사용 범위는 구현 단계에서 환경설정으로 선택

## 9. Supabase 프로젝트

프로젝트 공개 URL:

```text
https://rdhnynswyxhczqummtxc.supabase.co
```

프로젝트 참조 ID:

```text
rdhnynswyxhczqummtxc
```

공개 URL, REST API와 인증 API가 응답하는 것까지 확인했다. 루트의 `404`와 키 없는 API 요청의 `401`은 정상이다.

프로젝트를 만들 때 다음 옵션을 사용하기로 했다.

- Enable automatic RLS: 활성화

아직 확인 또는 수행하지 않은 항목:

- 실제 테이블 생성
- Alembic migration 적용
- 개별 RLS 정책 생성과 사용자 격리 테스트
- 카카오 Provider 설정과 Redirect URI
- Storage private bucket 생성

## 10. 보안 주의사항

인수인계 파일에는 비밀값을 기록하지 않는다. 다음 값은 Supabase 대시보드에서 새 컴퓨터의 로컬 `.env`로 직접 입력한다.

- PostgreSQL 연결 문자열과 비밀번호
- Supabase publishable key
- Supabase secret 또는 service-role key
- OpenAI API key

필수 원칙:

- 실제 `.env`를 Git에 올리지 않는다.
- secret/service-role 키를 React에 넣지 않는다.
- React는 FastAPI 보호 API를 통해 데이터를 변경한다.
- 요청 본문의 `user_id`를 신뢰하지 않는다.
- 실제 계좌번호, 카드번호, 주민등록번호를 저장하지 않는다.
- 토큰, 연결 문자열과 API 키를 로그에 출력하지 않는다.

예정된 환경변수 이름은 구현 계획의 Task 2를 따른다.

## 11. 예산과 분석의 핵심 규칙

예산은 이중 수입 구조를 사용한다.

```text
예상 수입 → 월초 추천 예산
실제 수입 → 입금 후 분석·남은 예산 보정
```

실제 수입이 예상보다 적을 때:

1. 이미 사용한 금액은 변경하지 않는다.
2. 남은 필수지출을 먼저 보호한다.
3. 예비비와 선택지출을 먼저 줄인다.
4. 필요하면 저축 목표 조정을 제안한다.
5. 남은 생활비와 하루 사용 가능 금액을 다시 계산한다.
6. 변경 전후 금액과 이유를 보여준다.

AI는 이 계산에 관여하지 않고 결과만 설명한다.

## 12. 현재 파일 상태

현재 `backend`와 `frontend`에는 기본 폴더만 있고 구현 코드는 없다.

현재 존재하는 핵심 파일:

```text
MyPace/docs/mypace-product-design.md
MyPace/docs/mypace-implementation-plan.md
MyPace/docs/mypace-home-handoff.md
```

현재 존재하는 기본 폴더:

```text
backend/app/core
backend/app/models
backend/app/repositories
backend/app/routers
backend/app/schemas
backend/app/services
backend/app/utils
backend/migrations
backend/tests
frontend/src/api
frontend/src/components/desktop
frontend/src/components/mobile
frontend/src/features
frontend/src/layouts
frontend/src/pages
frontend/src/styles
```

`mobile` 폴더가 존재하지만 1차 MVP에서 모바일 전용 컴포넌트를 구현한다는 의미는 아니다.

## 13. 구현 계획 상태

`docs/mypace-implementation-plan.md` 작성 완료:

- Task 10개
- 실행 체크 항목 63개
- 기능과 파일 연결표 포함
- 4주 기본 일정
- 2주 단축안
- Task별 테스트와 커밋 단계
- 단계별 검토 체크포인트

아직 어떤 Task도 구현하지 않았다.

## 14. 다른 컴퓨터로 이동하는 방법

### Git 저장소를 만들기 전

현재 프로젝트가 아직 Git 초기화 전이라면 `MyPace` 폴더 전체를 USB, 개인 클라우드 또는 압축 파일로 새 컴퓨터에 옮긴다. 비밀값이 담긴 `.env`가 생긴 이후에는 전송 매체와 접근 권한에 주의한다.

### 권장 방식

1. 기존 컴퓨터에서 `MyPace`를 Git 저장소로 초기화한다.
2. `.gitignore`와 문서만 최초 커밋한다.
3. 개인 GitHub 비공개 저장소를 연결한다.
4. 새 컴퓨터에서 저장소를 clone한다.
5. Supabase와 OpenAI 비밀값은 대시보드에서 새 `.env`에 다시 입력한다.
6. `.env` 파일 자체를 Git으로 이동하지 않는다.

GitHub 연결은 아직 수행하지 않았다.

## 15. 새 컴퓨터 준비사항

- VS Code
- Git
- Node.js와 npm
- Python 3.11 이상
- Supabase 계정 로그인
- 카카오 개발자 계정은 OAuth 설정 시 필요
- OpenAI API 계정은 AI 기능을 실제 연결할 때만 필요

VS Code에서 열 폴더:

```text
...\Personal project\MyPace
```

상위 `Personal project`가 아니라 `MyPace` 자체를 프로젝트 루트로 연다.

## 16. 다음 작업

사용자가 선택한 실행 방식:

```text
superpowers:subagent-driven-development
```

구현 전에 필요한 순서:

1. MyPace Git 저장소 초기화
2. 현재 문서를 초기 커밋
3. 격리된 worktree와 작업 브랜치 생성
4. `docs/mypace-implementation-plan.md` 사전 충돌 검사
5. 진행 기록 `.superpowers/sdd/progress.md` 생성
6. Task 1 구현 담당 subagent 실행
7. Task 1 테스트와 커밋
8. 별도 reviewer subagent의 명세·코드 품질 검토
9. 중요한 지적 수정 후 Task 2로 진행
10. Task 10까지 같은 방식으로 연속 실행

worktree 생성은 사용자 승인을 요청한 상태였고 아직 실행하지 않았다.

## 17. 구현 시 우선 확인할 위험 요소

- 구현 계획의 라이브러리 버전은 설치 시점의 호환 버전을 공식 문서에서 확인한다.
- Supabase PostgreSQL 직접 연결 권한은 RLS를 우회할 수 있으므로 FastAPI 소유권 검사를 생략하지 않는다.
- RLS 자동 활성화는 정책을 자동 생성하는 것이 아니므로 테이블별 정책이 필요하다.
- 무료 Supabase 플랜은 백업 정책을 확인하고 필요하면 정기적으로 DB dump를 보관한다.
- FastAPI가 계산한 금액과 React 표시 금액의 자료형과 반올림 규칙을 일치시킨다.
- 금액 계산에는 부동소수점 대신 Python `Decimal`과 PostgreSQL `NUMERIC`을 사용한다.
- 모바일 전용 UI를 1차 MVP 작업에 섞지 않는다.

## 18. 재개용 요청 문구

새 컴퓨터에서 Codex에게 다음처럼 요청하면 된다.

```text
D:\Personal project\MyPace\docs\mypace-home-handoff.md,
mypace-product-design.md,
mypace-implementation-plan.md를 먼저 읽어줘.
현재 구현 코드는 아직 없고 subagent-driven-development를 시작하기 직전이야.
Git 초기화와 격리 worktree 생성 여부를 확인한 뒤 구현 계획의 Task 1부터
TDD와 Task별 리뷰를 적용해서 진행해줘.
Personal project 상위 폴더 이름은 변경하지 말고 MyPace를 프로젝트 루트로 사용해줘.
```

새 컴퓨터의 실제 경로가 다르면 첫 줄의 경로만 변경한다.

## 19. 이번 작업의 대화 결정 기록

아래 내용은 이번 설계 대화에서 논의하고 확정한 사항을 시간순으로 요약한 기록이다. 새 컴퓨터에서 설계 의도를 파악하거나 변경 이유를 확인할 때 참고한다.

### 19.1 최초 아이디어

사용자가 처음 제시한 서비스 설명:

> 내 자산을 관리하고 AI가 소비와 투자까지 분석해주는 플랫폼

초기 후보 기능:

- 회원가입과 로그인
- OAuth와 이메일 인증
- 프로필
- 은행 계좌, 카드와 현금 관리
- 투자 관리
- 소비 패턴 분석
- 투자 리포트
- 월간 리포트와 PDF
- 자산 변화, 월별 소비, 카테고리별 소비와 투자 비중 그래프
- React, Flask, Supabase, Chart.js와 OpenAI API

처음에는 시연 가능한 준실서비스 방식이 적절하다고 판단했다.

### 19.2 서비스 방향 변경

논의 과정에서 투자 상담과 투자 관리가 프로젝트 목적을 흐릴 수 있다는 의견이 나왔다. 사용자가 만들고 싶은 핵심은 투자 플랫폼이 아니라 개인이 수입에 맞게 올바른 지출을 하도록 돕는 서비스라는 점을 명확히 했다.

최종 방향:

```text
개인 자산관리 + 수입 중심 예산 + 소비 분석
```

투자 종목 추천, 투자 비중 경고와 투자 상담은 프로젝트에서 제외했다.

### 19.3 AI 역할 논의

자유 대화형 재무상담 챗봇도 검토했지만 챗봇이 프로젝트의 중심 기능이 되지 않게 범위를 줄이기로 했다.

합의한 AI 역할:

- FastAPI가 계산한 소비 변화 설명
- 추천 예산의 이유 설명
- 월간 리포트 문장 생성
- 현재 재무 데이터 범위 안의 제한된 질문 답변
- 숫자 계산과 데이터 수정은 수행하지 않음
- 투자·대출·법률·세금 조언 금지
- AI 장애 시 고정 설명 문장으로 대체

### 19.4 개발 기간

사용 가능한 시간이 많지 않아 2~4주가 적절하다고 합의했다.

- 4주: 인증, 핵심 기능, 데스크톱 UI, AI 설명, PDF와 전체 테스트
- 2주: 인증, 수입, 거래, 예산, 분석과 데스크톱 대시보드에 집중
- CSV, 고급 AI 대화, PDF 저장 방식과 세부 차트는 단축 시 후순위

### 19.5 사용자 유형

서비스 사용자를 직장인과 대학생으로 설정했다.

직장인:

- 직장 급여 외에 부업 수입 가능
- 월 예상 실수령액과 실제 실수령액 직접 입력

대학생:

- 아르바이트 임금, 용돈과 장학금 등 입력
- 월 예상 실수령액과 실제 실수령액 직접 입력
- 수입 변동성과 남은 생활비 강조
- 이전 기간 대비 지출률 변화 강조

사용자 유형마다 기능과 테이블을 별도로 만들지 않고 공통 수입 구조를 사용하기로 했다. 초기 설정과 추천 기준, 화면의 강조 지표만 다르게 한다.

### 19.6 예상 수입과 실제 수입

AI가 수입과 기존 소비를 분석해 추천 예산을 먼저 제시하고 사용자가 조정하는 방식을 선택했다.

예산 이중 구조:

```text
예상액으로 월초 예산 수립
→ 실제 입금 후 분석과 남은 예산 보정
```

실제 수입이 예상보다 적을 때는 이미 발생한 지출과 남은 필수지출을 보호하고, 예비비·선택지출부터 축소한 뒤 필요하면 저축 목표 조정을 제안한다. 변경 전후 예산과 남은 일일 사용 가능 금액을 함께 보여주기로 했다.

### 19.7 금융기관 API 검토

은행·카드사 API와 금융결제원 오픈뱅킹 API 사용 가능성을 검토했다. 실제 데이터를 불러오는 운영 연동은 이용기관 승인, 계약, 보안체계와 개인정보 보호 요구로 인해 개인의 2~4주 MVP에서 구현하기 어렵다고 판단했다.

MVP 결정:

- 합성 거래 데이터 사용
- 모의 금융기관 연동 화면 제공 가능
- 계좌·카드·현금 계정은 시연용 정보만 저장
- 추후 승인받은 실제 API로 교체 가능한 공통 거래 형식 설계

### 19.8 인증 방식

Google OAuth보다 국내 사용자에게 익숙한 카카오 로그인이 적합하다는 의견을 반영했다.

결정:

- 이메일 회원가입·로그인·이메일 인증
- 카카오 OAuth 로그인
- Supabase Auth 사용
- Google OAuth는 MVP 제외

카카오 개발자 콘솔의 Provider 설정과 Redirect URI 등록은 아직 수행하지 않았다.

### 19.9 기술 방향 변경

초기에는 Flask를 검토했지만 사용자가 FastAPI를 사용하기로 변경했다.

FastAPI 참고 자료:

```text
https://blog.naver.com/red0808/224333133463
```

해당 글에서 확인한 구조:

```text
Router → Service → Repository
Schema(Pydantic)
Dependency Injection
SQLAlchemy 2.0
Alembic
JWT
```

MyPace에도 이 구조를 적용하기로 했다. 기존 설계와 구현 계획에 남아 있던 Flask 표현은 새 문서에서 모두 제거했다.

### 19.10 데이터베이스 선택

초보자가 사용하기 편하면서 안전하게 관리할 수 있는 후보로 Supabase PostgreSQL, Neon PostgreSQL, Firebase Firestore와 Railway PostgreSQL을 비교했다.

선택 결과:

```text
Supabase PostgreSQL
```

선택 이유:

- 웹 대시보드에서 테이블과 데이터를 확인하기 쉬움
- 완전한 PostgreSQL 사용
- SQLAlchemy와 Alembic 연동 가능
- Supabase Auth와 함께 사용 가능
- RLS로 사용자별 행 접근 제어 가능

권장 연결 구조:

```text
React → FastAPI → Supabase PostgreSQL
```

React가 데이터베이스 관리자 권한으로 직접 접근하지 않도록 했다.

### 19.11 Supabase 생성과 확인

사용자가 Supabase 조직 대시보드 주소를 공유했지만 로그인하지 않은 상태에서는 프로젝트 목록을 확인할 수 없었다. 이후 새 프로젝트를 만들고 공개 URL을 공유했다.

확인한 프로젝트 URL:

```text
https://rdhnynswyxhczqummtxc.supabase.co
```

루트 `404`, REST와 인증 API의 키 없는 요청 `401` 응답을 확인해 프로젝트와 API Gateway가 존재하고 권한 검사가 작동하는 것으로 판단했다.

### 19.12 자동 RLS 설정

Supabase 프로젝트 생성 화면의 다음 옵션을 활성화할지 질문이 있었다.

```text
Enable automatic RLS
Create an event trigger that automatically enables Row Level Security
on all new tables in the public schema.
```

개인 금융 데이터 특성상 활성화하는 것이 좋다고 결정했다.

추가로 명확히 한 내용:

- 자동 RLS는 새 테이블에 RLS를 켜는 안전장치
- 사용자별 접근 정책은 별도로 작성해야 함
- service-role 또는 일부 직접 DB 권한은 RLS를 우회할 수 있음
- FastAPI의 사용자 소유권 검사도 반드시 유지

### 19.13 프로젝트명 결정

후보로 Money Pace, WolFit, Budget Fit 등을 검토한 뒤 사용자가 다음 이름을 선택했다.

```text
MyPace
마이페이스
```

확정 슬로건:

> 내 수입에 맞춰, 소비도 마이페이스

### 19.14 폴더 이름과 프로젝트 구조

`Personal project`는 사용자의 개인 프로젝트 보관 폴더라서 이름을 변경하지 않기로 했다. 그 안에 `MyPace`를 만들었다.

```text
Personal project/
└── MyPace/
    ├── frontend/
    ├── backend/
    └── docs/
```

프런트엔드와 백엔드의 기본 하위 폴더까지 생성했지만 실제 소스코드는 아직 만들지 않았다.

### 19.15 디자인 시안

Visual Companion 방식으로 대시보드 시안을 확인했다.

승인된 디자인:

- 아이보리 배경
- 딥블루 내비게이션과 주요 버튼
- 민트 상태 강조
- 좌측 데스크톱 사이드바
- 상단 핵심 수치 카드
- 월별 소비 그래프
- 추천 예산
- 우측 MyPace 인사이트

사용자가 이 디자인으로 진행하는 것을 승인했다.

### 19.16 데스크톱과 모바일 구현 순서 변경

처음에는 데스크톱과 모바일 전용 컴포넌트를 동시에 만드는 방식을 검토했다. 이후 개발 시간을 고려해 순서를 변경했다.

최종 결정:

```text
데스크톱 웹 완성
→ 화면 폭 축소 시 깨짐 방지
→ 데스크톱 MVP 시연 완료
→ 모바일 전용 웹 UI는 후속 구현
```

이번 MVP에서는 React 기반 데스크톱 우선 반응형 웹을 만든다. 모바일 폴더가 존재하더라도 하단 메뉴, 모바일 카드 목록과 바텀시트를 지금 구현하지 않는다.

### 19.17 작성된 설계 문서

제품·기술 설계를 다음 파일로 정리했다.

```text
docs/mypace-product-design.md
```

문서에 포함된 주요 내용:

- 서비스 목표와 사용자
- 기능과 제외 범위
- 데스크톱·모바일 전략
- 화면과 디자인
- React와 FastAPI 구조
- Supabase 데이터 모델과 RLS
- 예산·소비 분석 규칙
- 보안 원칙
- 2~4주 일정과 시연 시나리오

### 19.18 writing-plans 단계

브레인스토밍과 제품 설계가 승인된 뒤 `superpowers:writing-plans`로 구현 계획을 작성했다.

```text
docs/mypace-implementation-plan.md
```

계획 구성:

- Task 1~10
- 테스트 실패 → 최소 구현 → 통과 → 커밋
- 파일 경로와 API 인터페이스
- Supabase schema와 RLS
- 인증, 거래, 예산, 분석, UI, PDF와 E2E
- 4주 일정과 2주 단축안
- 단계별 검토 체크포인트

### 19.19 기능과 파일 연결표

subagent가 기능의 연결 위치를 쉽게 찾을 수 있도록 구현 계획에 다음 추적표를 추가했다.

```text
기능
→ React 파일
→ FastAPI 파일
→ Supabase 테이블
→ API
→ 담당 Task
```

제품 설계서에서도 구현 계획의 `Feature-to-File Traceability`를 참조하도록 연결했다.

### 19.20 구현 방식 선택

사용자는 실제 구현 방식으로 다음을 선택했다.

```text
superpowers:subagent-driven-development
```

예정된 방식:

- Task마다 새로운 구현 subagent 사용
- 구현자 테스트와 자체 검토
- 별도 reviewer가 명세 준수와 코드 품질 검토
- 중요한 문제 수정 후 재검토
- 진행 기록을 파일에 남김
- 모든 Task 완료 후 전체 코드 리뷰

### 19.21 Git과 worktree 현재 상태

`subagent-driven-development`의 필수 사전 단계로 Git 저장소와 격리 worktree를 준비해야 한다. 하지만 현재 MyPace에는 소스코드가 없고 Git도 초기화되지 않았다.

권장 순서:

```text
문서와 .gitignore로 초기 Git 커밋
→ 격리 worktree 생성
→ Task 1부터 구현
```

이 작업을 실행해도 되는지 사용자 승인을 요청했지만, 다른 컴퓨터로 이동하기로 하면서 아직 수행하지 않았다.

### 19.22 다른 컴퓨터로 이동

사용자는 `Personal project` 폴더 자체를 새 컴퓨터로 가져갈 예정이다. 새 컴퓨터에서 위치가 달라져도 `MyPace` 폴더의 실제 경로만 새로 알려주면 된다.

예:

```text
C:\Users\새사용자\Documents\Personal project\MyPace
```

VS Code에서는 `Personal project` 상위 폴더보다 `MyPace`를 프로젝트 루트로 여는 것을 권장했다.

경로가 바뀌어도 유지되는 항목:

- React와 FastAPI 소스
- Supabase URL과 프로젝트 참조 ID
- 설계·구현·인수인계 문서
- 상대 경로 import
- Git 기록

새 컴퓨터에서 다시 만드는 항목:

- Python `.venv`
- `node_modules`
- 로컬 `.env`

### 19.23 현재 최종 상태

완료:

- MyPace 아이디어와 범위 확정
- 사용자와 예산 규칙 확정
- 투자 기능 제외
- React·FastAPI·Supabase 기술 방향 확정
- Supabase 프로젝트 생성과 공개 응답 확인
- 자동 RLS 활성화 결정
- 데스크톱 디자인 승인
- 제품 설계서 작성
- 구현 계획서 작성
- 기능·파일 추적표 작성
- 다른 컴퓨터용 인수인계 문서 작성

미완료:

- Git 초기화와 최초 커밋
- worktree와 구현 브랜치
- React와 FastAPI 초기화
- dependency 설치
- Supabase 테이블과 정책 적용
- 카카오 OAuth 설정
- Task 1~10 구현과 리뷰

새 컴퓨터에서는 이 문서와 두 설계 문서를 읽은 뒤 Git·worktree 준비부터 재개한다.
