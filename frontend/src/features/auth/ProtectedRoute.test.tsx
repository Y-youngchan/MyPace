import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

function renderProtectedRoute(authValue: {
  loading: boolean;
  session: Session | null;
  user: User | null;
}) {
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Private dashboard</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while auth is resolving", () => {
    renderProtectedRoute({ loading: true, session: null, user: null });

    expect(screen.getByText("로그인 상태를 확인하고 있습니다.")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute({ loading: false, session: null, user: null });

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders nested routes for authenticated users", () => {
    renderProtectedRoute({
      loading: false,
      session: { access_token: "token" } as Session,
      user: { id: "user-id" } as User,
    });

    expect(screen.getByText("Private dashboard")).toBeInTheDocument();
  });
});
