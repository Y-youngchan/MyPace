import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../../api/dashboard";
import type { DashboardSummary } from "../../api/dashboard";
import AppCard from "../../components/common/AppCard";
import MoneyText from "../../components/common/MoneyText";

const fallbackSummary: DashboardSummary = {
  period: currentMonthPeriod(),
  expected_income: "2800000.00",
  monthly_spent: "1240000.00",
  remaining_living_money: "620000.00",
  daily_available: "31000.00",
  budget_usage_percent: 64,
  recent_transactions: [
    { title: "점심 식사", category: "식비", amount: "12000.00" },
    { title: "지하철 정기권", category: "교통", amount: "55000.00" },
    { title: "카페", category: "생활", amount: "5800.00" },
  ],
  budget_progress: [
    { category: "식비", used_amount: "286000.00", budget_amount: "420000.00", used_percent: 68, status: "안정" },
    { category: "교통", used_amount: "67000.00", budget_amount: "160000.00", used_percent: 42, status: "여유" },
    { category: "생활", used_amount: "194000.00", budget_amount: "240000.00", used_percent: 81, status: "주의" },
  ],
  weekly_actions: [
    "외식 예산은 이번 주 90,000원 안에서 맞춰보세요.",
    "카페 지출은 2번만 줄여도 생활비 여유가 생겨요.",
    "월말 전에 실제 수입을 한 번 더 확인해보세요.",
  ],
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);

  useEffect(() => {
    getDashboardSummary(currentMonthPeriod())
      .then(setSummary)
      .catch(() => {
        setSummary(fallbackSummary);
      });
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        label: "이번 달 예상 수입",
        value: <MoneyText amount={toNumber(summary.expected_income)} />,
        note: "수입 페이지 기준",
      },
      {
        label: "이번 달 지출",
        value: <MoneyText amount={toNumber(summary.monthly_spent)} />,
        note: "이번 달 거래 합계",
      },
      {
        label: "남은 생활비",
        value: <MoneyText amount={toNumber(summary.remaining_living_money)} />,
        note: `하루 약 ${toNumber(summary.daily_available).toLocaleString("ko-KR")}원 사용 가능`,
      },
      {
        label: "예산 사용률",
        value: `${summary.budget_usage_percent}%`,
        note: budgetUsageNote(summary.budget_usage_percent),
      },
    ],
    [summary],
  );

  return (
    <div className="grid w-full max-w-[1680px] gap-7" data-testid="dashboard-page">
      <header className="flex items-center justify-between gap-6 max-[760px]:flex-col max-[760px]:items-start">
        <div>
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Dashboard</p>
          <h1 className="my-2 text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
            오늘의 마이페이스
          </h1>
          <p className="m-0 text-[#66758c]">이번 달 돈 흐름을 보고, 오늘 어느 속도로 써도 되는지 확인해요.</p>
        </div>
        <Link className="rounded-full bg-[#173b68] px-5 py-3 font-bold text-white no-underline" to="/transactions">
          거래 추가
        </Link>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="상단 요약">
        {summaryCards.map((card) => (
          <AppCard className="grid gap-2" key={card.label}>
            <p className="m-0 font-bold text-[#66758c]">{card.label}</p>
            <strong className="text-[clamp(1.45rem,2vw,2rem)] tracking-[-0.04em] text-[#173b68]">{card.value}</strong>
            <span className="text-sm text-[#6d7b8d]">{card.note}</span>
          </AppCard>
        ))}
      </section>

      <section className="grid grid-cols-[minmax(0,1.45fr)_minmax(340px,0.7fr)] gap-[18px] max-[1200px]:grid-cols-1">
        <AppCard className="bg-linear-to-br from-[#173b68] to-[#246393] text-white">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-white/80 uppercase">MyPace Insight</p>
          <h2 className="my-2.5 text-3xl font-extrabold tracking-[-0.04em]">아직 좋은 흐름이에요</h2>
          <p className="text-white/80">
            이번 달 지출은 예상 수입 안에서 관리되고 있어요. 다만 카페와 외식 지출이 조금 빨라지고
            있으니, 이번 주는 하루 생활비 기준을 먼저 확인하고 써보는 게 좋아요.
          </p>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">최근 거래</h2>
            <Link className="font-extrabold text-[#173b68] no-underline" to="/transactions">
              전체 보기
            </Link>
          </div>
          <ul className="mt-5 grid list-none gap-3.5 p-0">
            {summary.recent_transactions.map((transaction) => (
              <li
                className="flex items-center justify-between gap-4 border-t border-[#dfe5e2] pt-3.5"
                key={transaction.title}
              >
                <div className="grid gap-1">
                  <strong>{transaction.title}</strong>
                  <span className="text-sm text-[#738096]">{transaction.category}</span>
                </div>
                <MoneyText amount={toNumber(transaction.amount)} />
              </li>
            ))}
          </ul>
        </AppCard>
      </section>

      <section className="grid grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)] gap-[18px] max-[1200px]:grid-cols-1">
        <AppCard>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">예산 진행률</h2>
          <div className="mt-5 grid gap-5">
            {summary.budget_progress.map((item) => (
              <div className="grid gap-2" key={item.category}>
                <div className="flex items-center justify-between gap-3">
                  <strong>{item.category}</strong>
                  <span className="text-sm font-bold text-[#66758c]">
                    {item.used_percent}% · {item.status}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#eaf1f7]" aria-label={`${item.category} 예산 사용률`}>
                  <div className="h-full rounded-full bg-[#62c6ae]" style={{ width: `${item.used_percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AppCard>

        <AppCard className="bg-[#fdfaf0]">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">Next Pace</p>
          <h2 className="my-2.5 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이번 주 추천 행동</h2>
          <ul className="m-0 grid list-none gap-3 p-0">
            {summary.weekly_actions.map((action) => (
              <li className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" key={action}>
                {action}
              </li>
            ))}
          </ul>
        </AppCard>
      </section>
    </div>
  );
}

function currentMonthPeriod() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function toNumber(value: string) {
  return Number(value);
}

function budgetUsageNote(percent: number) {
  if (percent > 100) {
    return "예산을 넘었어요";
  }
  if (percent >= 80) {
    return "주의 구간이에요";
  }
  if (percent >= 50) {
    return "예산 안에서 안정적이에요";
  }
  return "여유가 있어요";
}
