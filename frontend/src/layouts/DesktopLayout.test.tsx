import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DesktopLayout from "./DesktopLayout";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

const auth = vi.mocked(supabase.auth);

describe("DesktopLayout", () => {
  it("signs out and moves back to login from the shared header", async () => {
    auth.signOut.mockResolvedValue({ error: null } as never);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<DesktopLayout />}>
            <Route path="/dashboard" element={<h1>대시보드 내용</h1>} />
          </Route>
          <Route path="/login" element={<h1>로그인 화면</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
      expect(screen.getByRole("heading", { name: "로그인 화면" })).toBeInTheDocument();
    });
  });
});
