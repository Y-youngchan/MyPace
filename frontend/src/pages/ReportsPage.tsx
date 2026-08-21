import { useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "../api/dashboard";
import type { DashboardBudgetProgress, DashboardSummary } from "../api/dashboard";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";

type ReportsState = {
  summary: DashboardSummary | null;
  error: string | null;
};

function currentMonthPeriod() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function toNumber(value: string) {
  return Number(value);
}

function formatWon(value: string) {
  return `${toNumber(value).toLocaleString("ko-KR")}원`;
}

function getMonthLabel(period: string) {
  const [year, month] = period.slice(0, 7).split("-");
  return `${year}년 ${month}월`;
}

function reportHeadline(summary: DashboardSummary) {
  const income = toNumber(summary.expected_income);
  const spent = toNumber(summary.monthly_spent);

  if (income <= 0 && spent <= 0) {
    return "아직 리포트를 만들 데이터가 부족해요.";
  }

  if (summary.budget_usage_percent > 100) {
    return "이번 달 예산을 넘어섰어요.";
  }

  if (summary.budget_usage_percent >= 80) {
    return "이번 달 소비 속도가 빨라지고 있어요.";
  }

  return "이번 달은 안정적인 흐름이에요.";
}

function reportDescription(summary: DashboardSummary) {
  const income = toNumber(summary.expected_income);
  const spent = toNumber(summary.monthly_spent);

  if (income <= 0 && spent <= 0) {
    return "수입, 예산, 거래를 입력하면 월간 리포트가 자동으로 채워져요.";
  }

  return `수입 ${formatWon(summary.expected_income)} 중 ${formatWon(summary.monthly_spent)}을 사용했어요.`;
}

function getTopCategory(items: DashboardBudgetProgress[]) {
  return [...items].sort((first, second) => second.used_percent - first.used_percent)[0] ?? null;
}

function statusTone(status: DashboardBudgetProgress["status"]) {
  if (status === "초과") {
    return "bg-[#fff1ef] text-[#9f3328]";
  }
  if (status === "주의") {
    return "bg-[#fdfaf0] text-[#b77818]";
  }
  return "bg-[#eef8f5] text-[#267866]";
}

export default function ReportsPage() {
  const [{ summary, error }, setReportsState] = useState<ReportsState>({ summary: null, error: null });

  useEffect(() => {
    getDashboardSummary(currentMonthPeriod())
      .then((response) => setReportsState({ summary: response, error: null }))
      .catch(() =>
        setReportsState({
          summary: null,
          error: "리포트 데이터를 불러오지 못했어요. 로그인 상태와 백엔드 서버를 확인해주세요.",
        }),
      );
  }, []);

  const topCategory = useMemo(() => getTopCategory(summary?.budget_progress ?? []), [summary]);

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Reports</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          리포트
        </h1>
        <p className="m-0 text-[#66758c]">이번 달 돈 흐름을 읽기 쉬운 월간 리포트로 정리해요.</p>
      </header>

      {error && (
        <p className="rounded-2xl bg-[#fff1ef] px-4 py-3 font-bold text-[#9f3328]" role="alert">
          {error}
        </p>
      )}

      {summary ? (
        <>
          <AppCard className="bg-linear-to-br from-[#173b68] to-[#246393] text-white">
            <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-white/70 uppercase">
              {getMonthLabel(summary.period)}
            </p>
            <h2 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em]">
              이번 달 리포트
            </h2>
            <p className="m-0 text-xl font-extrabold">{reportHeadline(summary)}</p>
            <p className="mb-0 mt-3 text-white/80">{reportDescription(summary)}</p>
          </AppCard>

          <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="리포트 요약">
            <AppCard>
              <p className="m-0 font-bold text-[#66758c]">월 수입</p>
              <strong className="mt-3 block text-[clamp(1.5rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">
                <MoneyText amount={toNumber(summary.expected_income)} />
              </strong>
            </AppCard>
            <AppCard>
              <p className="m-0 font-bold text-[#66758c]">월 지출</p>
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
                예산 사용률 {summary.budget_usage_percent}%
              </strong>
            </AppCard>
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] gap-[18px] max-[1100px]:grid-cols-1">
            <AppCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">카테고리 리포트</h2>
                <span className="rounded-full bg-[#eaf1f7] px-4 py-2 text-sm font-bold text-[#173b68]">DB 데이터 기준</span>
              </div>
              {summary.budget_progress.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {summary.budget_progress.map((item) => (
                    <div className="grid gap-3 rounded-3xl border border-[#dfe5e2] bg-[#fbfcfb] p-4" key={item.category}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <strong className="text-lg text-[#17253f]">{item.category}</strong>
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusTone(item.status)}`}>
                          {item.used_percent}% · {item.status}
                        </span>
                      </div>
                      <p className="m-0 text-sm text-[#66758c]">
                        <MoneyText amount={toNumber(item.used_amount)} /> 사용 / <MoneyText amount={toNumber(item.budget_amount)} /> 예산
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-[#f6f9fc] px-4 py-3 font-bold text-[#66758c]">
                  예산을 저장하면 카테고리 리포트가 채워져요.
                </p>
              )}
            </AppCard>

            <AppCard className="bg-[#f7faf9]">
              <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Summary Note</p>
              <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이번 달 체크포인트</h2>
              {topCategory ? (
                <p className="m-0 leading-7 text-[#66758c]">
                  가장 빠르게 사용 중인 카테고리는 <strong className="text-[#173b68]">{topCategory.category}</strong>예요.
                  다음 거래를 추가하기 전에 이 항목 예산을 먼저 확인해보세요.
                </p>
              ) : (
                <p className="m-0 leading-7 text-[#66758c]">카테고리별 예산과 거래가 쌓이면 핵심 체크포인트를 보여드릴게요.</p>
              )}
            </AppCard>
          </section>

          {summary.weekly_actions.length > 0 ? (
            <AppCard className="bg-[#fdfaf0]">
              <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">Action Report</p>
              <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">다음 행동</h2>
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
