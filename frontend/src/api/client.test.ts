import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./client";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

const auth = vi.mocked(supabase.auth);

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: "access-token" } },
      error: null,
    } as never);
  });

  it("sends the Supabase access token to the FastAPI backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiRequest<{ status: string }>("/health");

    expect(result).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/health", {
      headers: {
        authorization: "Bearer access-token",
        "content-type": "application/json",
      },
    });
  });

  it("keeps the backend status code when an API request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "프로필이 아직 없습니다." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/profile")).rejects.toMatchObject({
      status: 404,
      message: "프로필이 아직 없습니다.",
    } satisfies Partial<ApiError>);
  });
});
