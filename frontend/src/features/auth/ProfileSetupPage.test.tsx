import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfile } from "../../api/profile";
import ProfileSetupPage from "./ProfileSetupPage";

vi.mock("../../api/profile", () => ({
  saveProfile: vi.fn(),
}));

const save = vi.mocked(saveProfile);

function renderProfileSetupPage() {
  render(
    <MemoryRouter initialEntries={["/profile-setup"]}>
      <Routes>
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/dashboard" element={<h1>대시보드</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProfileSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    save.mockResolvedValue({
      user_id: "user-id",
      email: "youngchan@example.com",
      display_name: "찬이",
      full_name: "유영찬",
      nickname: "찬이",
      nickname_tag: "0001",
      phone_number: "010-1234-5678",
      user_type: "worker",
      primary_auth_provider: "google",
      auth_providers: ["google"],
    });
  });

  it("saves the social-login profile fields and moves to the dashboard", async () => {
    renderProfileSetupPage();

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "저장하고 대시보드로 이동" }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        display_name: "찬이",
        full_name: "유영찬",
        nickname: "찬이",
        phone_number: "010-1234-5678",
        user_type: "worker",
      });
    });
    expect(await screen.findByRole("heading", { name: "대시보드" })).toBeInTheDocument();
  });

  it("shows a nickname length guide before saving", async () => {
    renderProfileSetupPage();

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "길이가긴닉네임입니다요" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "저장하고 대시보드로 이동" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("닉네임은 10자 이내로 입력해주세요.");
    expect(save).not.toHaveBeenCalled();
  });
});
