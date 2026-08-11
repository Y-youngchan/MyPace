import { describe, expect, it } from "vitest";
import { formatMoneyInput, parseMoneyInput } from "./moneyInput";

describe("moneyInput", () => {
  it("adds comma separators while keeping only digits", () => {
    expect(formatMoneyInput("100000")).toBe("100,000");
    expect(formatMoneyInput("1,000,000")).toBe("1,000,000");
    expect(formatMoneyInput("월급 2800000원")).toBe("2,800,000");
  });

  it("turns a comma-formatted money input back into a number", () => {
    expect(parseMoneyInput("100,000")).toBe(100000);
    expect(parseMoneyInput("2,800,000원")).toBe(2800000);
    expect(parseMoneyInput("")).toBe(0);
  });
});
