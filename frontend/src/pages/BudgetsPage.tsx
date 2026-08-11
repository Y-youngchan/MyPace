import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";
import { calculateBudgetAllocation, calculateBudgetUsage } from "./budgetCalculations";

const incomeBaseline = 2_750_000;

const allocationRules = [
  { label: "고정비", ratio: 38, note: "월세, 통신비, 구독료처럼 매달 빠지는 돈" },
  { label: "생활비", ratio: 35, note: "식비, 교통, 카페, 쇼핑까지 매일 쓰는 돈" },
  { label: "저축", ratio: 20, note: "먼저 빼두면 흔들리지 않는 돈" },
  { label: "여유금", ratio: 7, note: "예상 밖 지출을 막아주는 완충 금액" },
];

const allocationCards = calculateBudgetAllocation(incomeBaseline, allocationRules);

const categoryBudgets = [
  { category: "식비", budget: 420_000, used: 286_000 },
  { category: "교통", budget: 160_000, used: 67_000 },
  { category: "생활", budget: 240_000, used: 194_000 },
  { category: "취미", budget: 130_000, used: 58_000 },
].map((item) => ({
  ...item,
  ...calculateBudgetUsage(item),
}));

const budgetTips = [
  "생활비는 하루 약 31,000원 안에서 쓰면 이번 달 흐름이 안정적이에요.",
  "식비는 아직 괜찮지만 외식이 늘면 주의 구간으로 빨리 넘어갈 수 있어요.",
  "저축 금액은 예산에서 먼저 빼두는 방식으로 유지하는 게 좋아요.",
];

export default function BudgetsPage() {
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
            <MoneyText amount={incomeBaseline} />
          </strong>
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
        </AppCard>
      </section>

      <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="추천 예산 배분">
        {allocationCards.map((item) => (
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
        ))}
      </section>

      <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(320px,0.7fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">카테고리별 사용률</h2>
          <div className="mt-5 grid gap-5">
            {categoryBudgets.map((item) => (
              <div className="grid gap-2" key={item.category}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-[#17253f]">{item.category}</strong>
                  <span className="text-sm font-bold text-[#66758c]">
                    {item.percent}% · {item.status}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#eaf1f7]" aria-label={`${item.category} 예산 사용률`}>
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                </div>
                <p className="m-0 text-sm text-[#66758c]">
                  <MoneyText amount={item.used} /> 사용 / <MoneyText amount={item.budget} /> 예산
                </p>
              </div>
            ))}
          </div>
        </AppCard>

        <AppCard className="bg-[#fdfaf0]">
          <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">Budget Memo</p>
          <h2 className="my-2.5 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이번 달 예산 메모</h2>
          <ul className="m-0 grid list-none gap-3 p-0">
            {budgetTips.map((tip) => (
              <li className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" key={tip}>
                {tip}
              </li>
            ))}
          </ul>
        </AppCard>
      </section>
    </div>
  );
}
