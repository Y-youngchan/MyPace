import { describe, expect, it } from "vitest";
import { calculateBudgetAllocation, calculateBudgetUsage } from "./budgetCalculations";

describe("calculateBudgetAllocation", () => {
  it("calculates budget amounts from the income baseline and allocation ratios", () => {
    expect(
      calculateBudgetAllocation(2_750_000, [
        { label: "고정비", ratio: 38 },
        { label: "생활비", ratio: 35 },
        { label: "저축", ratio: 20 },
        { label: "여유금", ratio: 7 },
      ]),
    ).toEqual([
      { label: "고정비", ratio: 38, amount: 1_045_000 },
      { label: "생활비", ratio: 35, amount: 962_500 },
      { label: "저축", ratio: 20, amount: 550_000 },
      { label: "여유금", ratio: 7, amount: 192_500 },
    ]);
  });

  it("keeps the total equal to the income baseline when ratios do not divide evenly", () => {
    const allocation = calculateBudgetAllocation(1_000_000, [
      { label: "첫째", ratio: 33 },
      { label: "둘째", ratio: 33 },
      { label: "셋째", ratio: 34 },
    ]);

    const total = allocation.reduce((sum, item) => sum + item.amount, 0);

    expect(total).toBe(1_000_000);
  });
});

describe("calculateBudgetUsage", () => {
  it("calculates budget usage percent and pace status from used and budget amounts", () => {
    expect(calculateBudgetUsage({ budget: 420_000, used: 286_000 })).toEqual({
      percent: 68,
      status: "안정",
      tone: "bg-[#62c6ae]",
    });

    expect(calculateBudgetUsage({ budget: 240_000, used: 194_000 })).toEqual({
      percent: 81,
      status: "주의",
      tone: "bg-[#d79b43]",
    });
  });

  it("marks a category as over pace when spending is above budget", () => {
    expect(calculateBudgetUsage({ budget: 100_000, used: 112_000 })).toEqual({
      percent: 112,
      status: "초과",
      tone: "bg-[#d66a5c]",
    });
  });
});
