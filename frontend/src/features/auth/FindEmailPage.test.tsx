import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import FindEmailPage from "./FindEmailPage";
import { findEmail } from "../../api/accountRecovery";

vi.mock("../../api/accountRecovery", () => ({
  findEmail: vi.fn(),
}));

const findEmailMock = vi.mocked(findEmail);

describe("FindEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findEmailMock.mockResolvedValue({ emails: ["youngchan@example.com"] });
  });

  it("finds emails with name and phone number", async () => {
    render(
      <BrowserRouter>
        <FindEmailPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "01012345678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일 찾기" }));

    await waitFor(() => {
      expect(findEmailMock).toHaveBeenCalledWith({
        full_name: "유영찬",
        phone_number: "01012345678",
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("youngchan@example.com");
  });
});
