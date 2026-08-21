import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getProfile, saveProfile } from "../../api/profile";
import { supabase } from "../../lib/supabase";
import ProfilePage from "./ProfilePage";

vi.mock("../../api/profile", () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
  },
}));

const loadProfile = vi.mocked(getProfile);
const save = vi.mocked(saveProfile);
const auth = vi.mocked(supabase.auth);

function renderProfilePage() {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
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
    save.mockResolvedValue({
      user_id: "user-id",
      email: "youngchan@example.com",
      display_name: "마페",
      full_name: "유영찬",
      nickname: "마페",
      nickname_tag: "0002",
      phone_number: "010-1234-5678",
      user_type: "worker",
      primary_auth_provider: "email",
      auth_providers: ["email"],
    });
    auth.updateUser.mockResolvedValue({ data: {}, error: null } as never);
  });

  it("loads profile information and saves a changed nickname", async () => {
    renderProfilePage();

    expect(await screen.findByDisplayValue("찬이")).toBeInTheDocument();
    expect(screen.getByText("youngchan@example.com")).toBeInTheDocument();
    expect(screen.getByText("#0001")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("새 닉네임"), { target: { value: "마페" } });
    fireEvent.click(screen.getByRole("button", { name: "닉네임 저장" }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        display_name: "마페",
        full_name: "유영찬",
        nickname: "마페",
        phone_number: "010-1234-5678",
        user_type: "worker",
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("닉네임이 변경됐어요.");
  });

  it("changes the signed-in user's password", async () => {
    renderProfilePage();

    await screen.findByDisplayValue("찬이");
    fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() => {
      expect(auth.updateUser).toHaveBeenCalledWith({ password: "safe1234!" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("비밀번호가 변경됐어요.");
  });

  it("shows a guide before saving an invalid password", async () => {
    renderProfilePage();

    await screen.findByDisplayValue("찬이");
    fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
