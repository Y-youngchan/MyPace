import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import { ApiError } from "../../api/client";
import { getProfile } from "../../api/profile";
import { AuthContext } from "./AuthProvider";
import ProfileCompletionRoute from "./ProfileCompletionRoute";

vi.mock("../../api/profile", () => ({
  getProfile: vi.fn(),
}));

vi.mock("./devAccess", () => ({
  isDevDashboardAccessEnabled: vi.fn(() => false),
}));

const loadProfile = vi.mocked(getProfile);

function renderProfileCompletionRoute() {
  render(
    <AuthContext.Provider
      value={{
        loading: false,
        isPreviewMode: false,
        session: { access_token: "token" } as Session,
        user: { id: "user-id" } as User,
      }}
    >
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProfileCompletionRoute />}>
            <Route path="/dashboard" element={<p>Dashboard content</p>} />
          </Route>
          <Route path="/profile-setup" element={<p>Profile setup</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProfileCompletionRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("renders internal pages when the signed-in user already has a complete profile", async () => {
    renderProfileCompletionRoute();

    expect(await screen.findByText("Dashboard content")).toBeInTheDocument();
  });

  it("moves signed-in users without a profile to profile setup", async () => {
    loadProfile.mockRejectedValueOnce(new ApiError(404, "프로필이 아직 없습니다."));

    renderProfileCompletionRoute();

    expect(await screen.findByText("Profile setup")).toBeInTheDocument();
  });

  it("moves signed-in users with missing profile fields to profile setup", async () => {
    loadProfile.mockResolvedValueOnce({
      user_id: "user-id",
      email: "youngchan@example.com",
      display_name: "찬이",
      full_name: "",
      nickname: "찬이",
      nickname_tag: "0001",
      phone_number: "",
      user_type: "worker",
      primary_auth_provider: "google",
      auth_providers: ["google"],
    });

    renderProfileCompletionRoute();

    expect(await screen.findByText("Profile setup")).toBeInTheDocument();
  });
});
