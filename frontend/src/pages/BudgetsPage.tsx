import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { getDashboardSummary } from "../api/dashboard";
import type { DashboardBudgetProgress } from "../api/dashboard";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";
import type { BudgetResponse, IncomeEntry } from "../types/api";
import { calculateBudgetAllocation } from "./budgetCalculations";

const allocationRules = [
  { label: "고정비", ratio: 38, note: "월세, 통신비, 구독료처럼 매달 빠지는 돈" },
  { label: "생활비", ratio: 35, note: "식비, 교통, 카페, 쇼핑까지 매일 쓰는 돈" },
  { label: "저축", ratio: 20, note: "먼저 빼두면 흔들리지 않는 돈" },
  { label: "여유금", ratio: 7, note: "예상 밖 지출을 막아주는 완충 금액" },
];

type BudgetNotice = {
  tone: "success" | "error";
  message: string;
};

type AllocationCard = {
  label: string;
  ratio: number;
  amount: number;
  note: string;
};

function getCurrentBudgetPeriod() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function buildSavedAllocationCards(budget: BudgetResponse): AllocationCard[] {
  const basisIncomeAmount = Number(budget.basis_income_amount);
  const knownItems = allocationRules
    .filter((rule) => budget.items[rule.label] !== undefined)
    .map((rule) => [rule.label, budget.items[rule.label]] as const);
  const extraItems = Object.entries(budget.items).filter(
    ([label]) => !allocationRules.some((rule) => rule.label === label),
  );

  return [...knownItems, ...extraItems].map(([label, rawAmount]) => {
    const amount = Number(rawAmount);
    const rule = allocationRules.find((item) => item.label === label);
    return {
      label,
      amount,
      ratio: basisIncomeAmount > 0 ? Math.round((amount / basisIncomeAmount) * 100) : 0,
      note: rule?.note ?? "저장된 예산 항목이에요.",
    };
  });
}

function budgetTone(status: DashboardBudgetProgress["status"]) {
  if (status === "초과") {
    return "bg-[#9f3328]";
  }
  if (status === "주의") {
    return "bg-[#d79b43]";
  }
  return "bg-[#62c6ae]";
}

export default function BudgetsPage() {
  const [incomeBaseline, setIncomeBaseline] = useState<number | null>(null);
  const [baselineLabel, setBaselineLabel] = useState("수입 데이터 없음");
  const [savedAllocationCards, setSavedAllocationCards] = useState<AllocationCard[] | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<DashboardBudgetProgress[]>([]);
  const [budgetTips, setBudgetTips] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [budgetNotice, setBudgetNotice] = useState<BudgetNotice | null>(null);

  useEffect(() => {
    const loadIncomeBaseline = () =>
      apiRequest<IncomeEntry[]>("/incomes")
        .then((entries) => {
          const latestEntry = entries[0];
          if (!latestEntry) {
            setIncomeBaseline(null);
            setBaselineLabel("수입 데이터 없음");
            setSavedAllocationCards(null);
            return;
          }
          const actualAmount = Number(latestEntry.actual_amount ?? 0);
          if (actualAmount > 0) {
            setIncomeBaseline(actualAmount);
            setBaselineLabel("실제 입금 기준");
            setSavedAllocationCards(null);
            return;
          }
          setIncomeBaseline(Number(latestEntry.expected_amount));
          setBaselineLabel("예상 수입 기준");
          setSavedAllocationCards(null);
        })
        .catch(() => {
          setIncomeBaseline(null);
          setBaselineLabel("수입 데이터 없음");
          setSavedAllocationCards(null);
        });

    apiRequest<BudgetResponse>(`/budgets/${getCurrentBudgetPeriod()}`)
      .then((entries) => {
        setIncomeBaseline(Number(entries.basis_income_amount));
        setBaselineLabel("저장된 예산 기준");
        setSavedAllocationCards(buildSavedAllocationCards(entries));
      })
      .catch(() => {
        void loadIncomeBaseline();
      });
  }, []);

  useEffect(() => {
    getDashboardSummary(getCurrentBudgetPeriod())
      .then((summary) => {
        setCategoryBudgets(summary.budget_progress);
        setBudgetTips(summary.weekly_actions);
      })
      .catch(() => {
        setCategoryBudgets([]);
        setBudgetTips([]);
      });
  }, []);

  const allocationCards = useMemo(
    () => savedAllocationCards ?? (incomeBaseline === null ? [] : calculateBudgetAllocation(incomeBaseline, allocationRules)),
    [incomeBaseline, savedAllocationCards],
  );

  const handleSaveBudget = async () => {
    if (incomeBaseline === null || allocationCards.length === 0) {
      setBudgetNotice({ tone: "error", message: "수입 데이터가 있어야 예산을 저장할 수 있어요." });
      return;
    }

    setIsSaving(true);
    setBudgetNotice(null);

    try {
      await apiRequest(`/budgets/${getCurrentBudgetPeriod()}`, {
        method: "PUT",
        body: JSON.stringify({
          basis_income_amount: incomeBaseline,
          items: allocationCards.map((item) => ({
            category_name: item.label,
            amount: item.amount,
            reason: item.note,
          })),
        }),
      });
      setSavedAllocationCards(allocationCards);
      setBaselineLabel("저장된 예산 기준");
      setBudgetNotice({ tone: "success", message: "예산이 저장됐어요." });
    } catch {
      setBudgetNotice({
        tone: "error",
        message: "예산을 저장하지 못했어요. 로그인 상태와 백엔드 서버를 확인해주세요.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Budget</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          예산
        </h1>
        <p className="m-0 text-[#66758c]">이번 달 수입 기준선에 맞춰 먼저 쓸 돈과 남겨둘 돈을 나눠봐요.</p>
      </header>

      <section className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard className="bg-[#eef8f5]">
          <p className="m-0 font-bold text-[#3b947f]">월 수입 기준선</p>
          <strong className="mt-3 block text-[clamp(2rem,4vw,3.3rem)] leading-none tracking-[-0.04em] text-[#173b68]">
            {incomeBaseline === null ? "수입 데이터가 아직 없어요." : <MoneyText amount={incomeBaseline} />}
          </strong>
          <span className="mt-3 inline-block rounded-full bg-white/70 px-3 py-1 text-sm font-extrabold text-[#3b947f]">
            {baselineLabel}
          </span>
          <p className="mb-0 mt-4 text-[#4c5f7c]">
            수입 페이지의 실제 입금 기준을 바탕으로 이번 달 예산을 나누는 기준이에요.
          </p>
        </AppCard>

        <AppCard className="bg-[#173b68] text-white">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-white/70 uppercase">Recommended Pace</p>
          <h2 className="my-2.5 text-2xl font-extrabold tracking-[-0.04em]">추천 예산 배분</h2>
          <p className="m-0 text-white/80">
            고정비를 먼저 잠그고, 생활비는 하루 단위로 쪼개서 보는 방식이에요. 남는 금액은 저축과 여유금으로
            분리해두면 월말에 흔들릴 가능성이 줄어요.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#173b68] shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-[#f6f9fc] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={isSaving || incomeBaseline === null || allocationCards.length === 0}
              onClick={handleSaveBudget}
              type="button"
            >
              {isSaving ? "저장 중..." : "예산 확정 저장"}
            </button>
            {budgetNotice ? (
              <p
                className={`m-0 text-sm font-bold ${
                  budgetNotice.tone === "success" ? "text-[#a8f0dc]" : "text-[#ffd0d0]"
                }`}
                role={budgetNotice.tone === "success" ? "status" : "alert"}
              >
                {budgetNotice.message}
              </p>
            ) : null}
          </div>
        </AppCard>
      </section>

      <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="추천 예산 배분">
        {allocationCards.length > 0 ? (
          allocationCards.map((item) => (
            <AppCard className="grid gap-3" key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="m-0 font-bold text-[#66758c]">{item.label}</p>
                <span className="rounded-full bg-[#eaf1f7] px-3 py-1 text-xs font-extrabold text-[#173b68]">
                  {item.ratio}%
                </span>
              </div>
              <strong className="text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">
                <MoneyText amount={item.amount} />
              </strong>
              <p className="m-0 text-sm text-[#66758c]">{item.note}</p>
            </AppCard>
          ))
        ) : (
          <AppCard className="col-span-full">
            <p className="m-0 font-bold text-[#66758c]">수입을 먼저 입력하면 예산 배분을 계산해드릴게요.</p>
          </AppCard>
        )}
      </section>

      <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(320px,0.7fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">카테고리별 사용률</h2>
          <div className="mt-5 grid gap-5">
            {categoryBudgets.length > 0 ? (
              categoryBudgets.map((item) => (
                <div className="grid gap-2" key={item.category}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[#17253f]">{item.category}</strong>
                    <span className="text-sm font-bold text-[#66758c]">
                      {item.used_percent}% · {item.status}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eaf1f7]" aria-label={`${item.category} 예산 사용률`}>
                    <div className={`h-full rounded-full ${budgetTone(item.status)}`} style={{ width: `${item.used_percent}%` }} />
                  </div>
                  <p className="m-0 text-sm text-[#66758c]">
                    <MoneyText amount={Number(item.used_amount)} /> 사용 / <MoneyText amount={Number(item.budget_amount)} /> 예산
                  </p>
                </div>
              ))
            ) : (
              <p className="m-0 rounded-2xl bg-[#f6f9fc] px-4 py-3 font-bold text-[#66758c]">
                카테고리별 예산 사용 데이터가 아직 없어요.
              </p>
            )}
          </div>
        </AppCard>

        <AppCard className="bg-[#fdfaf0]">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">Budget Memo</p>
          <h2 className="my-2.5 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이번 달 예산 메모</h2>
          {budgetTips.length > 0 ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {budgetTips.map((tip) => (
                <li className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" key={tip}>
                  {tip}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]">
              실제 예산과 거래 데이터가 쌓이면 이번 달 메모가 표시돼요.
            </p>
          )}
        </AppCard>
      </section>
    </div>
  );
}
