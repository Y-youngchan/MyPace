import { useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "../api/dashboard";
import type { DashboardBudgetProgress, DashboardSummary } from "../api/dashboard";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";

type AnalyticsState = {
  summary: DashboardSummary | null;
  error: string | null;
};

function currentMonthPeriod() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function toNumber(value: string) {
  return Number(value);
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

function budgetInsight(percent: number) {
  if (percent > 100) {
    return "이번 달 예산을 넘었어요. 큰 지출부터 먼저 확인해보세요.";
  }
  if (percent >= 80) {
    return "예산 사용 속도가 빨라지고 있어요. 남은 기간 기준을 조금 낮춰보는 게 좋아요.";
  }
  if (percent >= 50) {
    return "아직 예산 안에서 관리되고 있어요. 자주 쓰는 카테고리만 한 번 더 확인해보세요.";
  }
  return "여유가 있는 흐름이에요. 지금 페이스를 유지하면 좋아요.";
}

function getTopBudgetCategory(items: DashboardBudgetProgress[]) {
  return [...items].sort((first, second) => second.used_percent - first.used_percent)[0] ?? null;
}

export default function AnalyticsPage() {
  const [{ summary, error }, setAnalyticsState] = useState<AnalyticsState>({ summary: null, error: null });

  useEffect(() => {
    getDashboardSummary(currentMonthPeriod())
      .then((response) => setAnalyticsState({ summary: response, error: null }))
      .catch(() =>
        setAnalyticsState({
          summary: null,
          error: "분석 데이터를 불러오지 못했어요. 로그인 상태와 백엔드 서버를 확인해주세요.",
        }),
      );
  }, []);

  const hasEnoughData = summary
    ? toNumber(summary.expected_income) > 0 || toNumber(summary.monthly_spent) > 0 || summary.budget_progress.length > 0
    : false;

  const topBudgetCategory = useMemo(() => getTopBudgetCategory(summary?.budget_progress ?? []), [summary]);

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Analytics</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          분석
        </h1>
        <p className="m-0 text-[#66758c]">이번 달 수입, 지출, 예산 사용 속도를 한눈에 정리해요.</p>
      </header>

      {error && (
        <p className="rounded-2xl bg-[#fff1ef] px-4 py-3 font-bold text-[#9f3328]" role="alert">
          {error}
        </p>
      )}

      {summary && !hasEnoughData ? (
        <AppCard className="bg-[#f7faf9]">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">First Analysis</p>
          <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">분석할 데이터가 아직 부족해요.</h2>
          <p className="m-0 text-[#66758c]">
            수입, 예산, 거래를 입력하면 이 화면에서 소비 흐름을 자동으로 정리해드릴게요.
          </p>
        </AppCard>
      ) : null}

      {summary ? (
        <>
          <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="분석 요약">
            <AppCard>
              <p className="m-0 font-bold text-[#66758c]">이번 달 수입</p>
              <strong className="mt-3 block text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">
                <MoneyText amount={toNumber(summary.expected_income)} />
              </strong>
            </AppCard>
            <AppCard>
              <p className="m-0 font-bold text-[#66758c]">이번 달 지출</p>
              <strong className="mt-3 block text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#9f3328]">
                <MoneyText amount={toNumber(summary.monthly_spent)} />
              </strong>
            </AppCard>
            <AppCard className="bg-[#eef8f5]">
              <p className="m-0 font-bold text-[#267866]">남은 생활비</p>
              <strong className="mt-3 block text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">
                <MoneyText amount={toNumber(summary.remaining_living_money)} />
              </strong>
            </AppCard>
            <AppCard className="bg-[#fdfaf0]">
              <p className="m-0 font-bold text-[#b77818]">예산 사용률</p>
              <strong className="mt-3 block text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">
                {summary.budget_usage_percent}%
              </strong>
            </AppCard>
          </section>

          <section className="grid grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-[18px] max-[1100px]:grid-cols-1">
            <AppCard>
              <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Pace Insight</p>
              <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이번 달 소비 속도</h2>
              <p className="m-0 leading-7 text-[#66758c]">{budgetInsight(summary.budget_usage_percent)}</p>
              {topBudgetCategory ? (
                <div className="mt-5 rounded-3xl bg-[#f6f9fc] p-5">
                  <p className="m-0 text-sm font-extrabold text-[#66758c]">가장 빠른 카테고리</p>
                  <strong className="mt-2 block text-2xl tracking-[-0.04em] text-[#173b68]">{topBudgetCategory.category}</strong>
                  <p className="m-0 mt-2 text-[#66758c]">
                    현재 {topBudgetCategory.used_percent}% 사용 중이에요. 남은 기간에는 이 항목을 먼저 확인하면 좋아요.
                  </p>
                </div>
              ) : null}
            </AppCard>

            <AppCard>
              <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">최근 거래 힌트</h2>
              {summary.recent_transactions.length > 0 ? (
                <ul className="mt-5 grid list-none gap-3 p-0">
                  {summary.recent_transactions.map((transaction) => (
                    <li className="flex items-center justify-between gap-4 rounded-2xl bg-[#f6f9fc] px-4 py-3" key={transaction.title}>
                      <div className="grid gap-1">
                        <strong className="text-[#17253f]">{transaction.title}</strong>
                        <span className="text-sm font-bold text-[#66758c]">{transaction.category}</span>
                      </div>
                      <MoneyText amount={toNumber(transaction.amount)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-2xl bg-[#f6f9fc] px-4 py-3 font-bold text-[#66758c]">최근 거래가 아직 없어요.</p>
              )}
            </AppCard>
          </section>

          <AppCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">카테고리별 예산 분석</h2>
              <span className="rounded-full bg-[#eaf1f7] px-4 py-2 text-sm font-bold text-[#173b68]">DB 데이터 기준</span>
            </div>
            {summary.budget_progress.length > 0 ? (
              <div className="mt-5 grid gap-5">
                {summary.budget_progress.map((item) => (
                  <div className="grid gap-2" key={item.category}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong className="text-[#17253f]">{item.category}</strong>
                      <span className="text-sm font-bold text-[#66758c]">
                        {item.used_percent}% · {item.status}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#eaf1f7]" aria-label={`${item.category} 분석 사용률`}>
                      <div className={`h-full rounded-full ${budgetTone(item.status)}`} style={{ width: `${Math.min(item.used_percent, 100)}%` }} />
                    </div>
                    <p className="m-0 text-sm text-[#66758c]">
                      <MoneyText amount={toNumber(item.used_amount)} /> 사용 / <MoneyText amount={toNumber(item.budget_amount)} /> 예산
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#f6f9fc] px-4 py-3 font-bold text-[#66758c]">
                예산을 저장하면 카테고리별 분석이 표시돼요.
              </p>
            )}
          </AppCard>

          {summary.weekly_actions.length > 0 ? (
            <AppCard className="bg-[#fdfaf0]">
              <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">Next Pace</p>
              <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">추천 행동</h2>
              <ul className="m-0 grid list-none gap-3 p-0">
                {summary.weekly_actions.map((action) => (
                  <li className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" key={action}>
                    {action}
                  </li>
                ))}
              </ul>
            </AppCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
