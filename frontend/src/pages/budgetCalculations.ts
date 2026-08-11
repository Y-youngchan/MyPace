type AllocationRule = {
  label: string;
  ratio: number;
};

export function calculateBudgetAllocation<TRule extends AllocationRule>(incomeBaseline: number, rules: TRule[]) {
  let allocatedAmount = 0;

  return rules.map((rule, index) => {
    const isLastRule = index === rules.length - 1;
    const amount = isLastRule ? incomeBaseline - allocatedAmount : Math.round((incomeBaseline * rule.ratio) / 100);

    allocatedAmount += amount;

    return {
      ...rule,
      amount,
    };
  });
}

export function calculateBudgetUsage({ budget, used }: { budget: number; used: number }) {
  const percent = budget > 0 ? Math.round((used / budget) * 100) : 0;

  if (percent > 100) {
    return {
      percent,
      status: "초과",
      tone: "bg-[#d66a5c]",
    };
  }

  if (percent >= 80) {
    return {
      percent,
      status: "주의",
      tone: "bg-[#d79b43]",
    };
  }

  return {
    percent,
    status: percent >= 60 ? "안정" : "여유",
    tone: "bg-[#62c6ae]",
  };
}
