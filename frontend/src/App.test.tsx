import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthContext } from "./features/auth/AuthProvider";
import { getProfile } from "./api/profile";
import { supabase } from "./lib/supabase";

vi.mock("./lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("./api/profile", () => ({
  getProfile: vi.fn(),
}));

const loadProfile = vi.mocked(getProfile);
const auth = vi.mocked(supabase.auth);

function renderApp(
  path: string,
  authValue: {
    isPreviewMode?: boolean;
    loading: boolean;
    session: Session | null;
    user: User | null;
  } = { loading: false, session: { access_token: "token" } as Session, user: { id: "user-id" } as User },
) {
  window.history.pushState({}, "", path);

  render(
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthContext.Provider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null } as never);
    loadProfile.mockResolvedValue({
      user_id: "user-id",
      email: "youngchan@example.com",
      display_name: "찬이",
      full_name: "유영찬",
      nickname: "찬이",
      nickname_tag: "0001",
      phone_number: "010-1234-5678",
      user_type: "worker",
      primary_auth_provider: "email",
      auth_providers: ["email"],
    });
  });

  it("shows the dashboard for authenticated users", async () => {
    renderApp("/dashboard");

    expect(screen.getByText("MyPace")).toBeInTheDocument();
    expect(screen.getByText("내 수입에 맞춰, 소비도 마이페이스")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "오늘의 마이페이스" })).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderApp("/dashboard", { loading: false, session: null, user: null });

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
  });

  it("shows the login start screen when an unauthenticated user opens the root path", () => {
    renderApp("/", { loading: false, session: null, user: null });

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByText("회원가입 후 나만의 지출 관리를 시작해보세요.")).toBeInTheDocument();
  });

  it("renders the separate sign-up page", () => {
    renderApp("/signup", { loading: false, session: null, user: null });

    expect(screen.getByRole("heading", { name: "회원가입" })).toBeInTheDocument();
    expect(screen.queryByText("이미 존재하는 이메일이면 바로 알려드릴게요.")).not.toBeInTheDocument();
  });

  it("renders account recovery routes", () => {
    renderApp("/find-email", { loading: false, session: null, user: null });
    expect(screen.getByRole("heading", { name: "이메일 찾기" })).toBeInTheDocument();

    renderApp("/forgot-password", { loading: false, session: null, user: null });
    expect(screen.getByRole("heading", { name: "비밀번호 찾기" })).toBeInTheDocument();

    renderApp("/update-password", { loading: false, session: null, user: null });
    expect(screen.getByRole("heading", { name: "새 비밀번호 설정" })).toBeInTheDocument();
  });

  it("renders the OAuth callback route before protected dashboard routing", () => {
    renderApp("/auth/callback?code=oauth-code", { loading: false, session: null, user: null });

    expect(screen.getByRole("heading", { name: "로그인 연결 중" })).toBeInTheDocument();
  });

  it("renders placeholder pages for sidebar routes", async () => {
    renderApp("/income");

    expect(await screen.findByRole("heading", { name: "수입" })).toBeInTheDocument();
  });

  it("renders the budgets page route", async () => {
    renderApp("/budgets");

    expect(await screen.findByRole("heading", { name: "예산" })).toBeInTheDocument();
    expect(screen.getByText("추천 예산 배분")).toBeInTheDocument();
  });

  it("renders the calendar page route", async () => {
    renderApp("/calendar");

    expect(await screen.findByRole("heading", { name: "캘린더" })).toBeInTheDocument();
  });

  it("shows a logout button in protected pages", () => {
    renderApp("/dashboard");

    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});
