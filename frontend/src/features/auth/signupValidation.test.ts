import { describe, expect, it } from "vitest";
import { isValidSignupPassword } from "./signupValidation";

describe("isValidSignupPassword", () => {
  it("requires at least 8 characters with English letters and numbers", () => {
    expect(isValidSignupPassword("abcd1234")).toBe(true);
    expect(isValidSignupPassword("abcd1234!")).toBe(true);
    expect(isValidSignupPassword("abcdefgh")).toBe(false);
    expect(isValidSignupPassword("12345678")).toBe(false);
    expect(isValidSignupPassword("abc123")).toBe(false);
  });
});
