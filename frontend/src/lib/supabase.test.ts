import { describe, expect, it } from "vitest";
import { getSupabaseRuntimeState } from "./supabase";

describe("getSupabaseRuntimeState", () => {
  it("allows preview mode only in development when Supabase env values are missing", () => {
    expect(
      getSupabaseRuntimeState({
        DEV: true,
      }),
    ).toEqual({
      isConfigured: false,
      isLocalPreviewMode: true,
    });
  });

  it("does not allow preview mode in production when Supabase env values are missing", () => {
    expect(
      getSupabaseRuntimeState({
        DEV: false,
      }),
    ).toEqual({
      isConfigured: false,
      isLocalPreviewMode: false,
    });
  });

  it("treats Supabase as configured only when both env values exist", () => {
    expect(
      getSupabaseRuntimeState({
        DEV: false,
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toEqual({
      isConfigured: true,
      isLocalPreviewMode: false,
    });
  });
});
