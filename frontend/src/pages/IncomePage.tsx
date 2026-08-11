import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";
import type { IncomeEntry } from "../types/api";
import { formatMoneyInput, parseMoneyInput } from "../utils/moneyInput";

const currentMonth = new Date().toISOString().slice(0, 7);

type IncomeNotice = {
  tone: "success" | "error";
  text: string;
} | null;

function formatIncomeDate(value: string | null) {
  if (!value) {
    return "입금일 미입력";
  }
  return value.slice(0, 10);
}

export default function IncomePage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [sourceName, setSourceName] = useState("월급");
  const [period, setPeriod] = useState(currentMonth);
  const [expectedAmount, setExpectedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [notice, setNotice] = useState<IncomeNotice>(null);

  useEffect(() => {
    apiRequest<IncomeEntry[]>("/incomes")
      .then(setEntries)
      .catch(() => setNotice({ tone: "error", text: "수입 목록을 불러오지 못했어요." }));
  }, []);

  const latestEntry = entries[0];
  const latestExpected = Number(latestEntry?.expected_amount ?? 0);
  const latestActual = Number(latestEntry?.actual_amount ?? 0);
  const incomeGap = latestActual > 0 ? latestActual - latestExpected : 0;
  const incomeBaseline = latestActual > 0 ? latestActual : latestExpected;
  const incomeBaselineLabel = latestActual > 0 ? "실제 입금 기준" : "예상 수입 기준";
  const budgetReflectionText =
    incomeBaseline > 0
      ? `${incomeBaseline.toLocaleString("ko-KR")}원을 이번 달 예산 계산에 반영할 수 있어요.`
      : "수입을 입력하면 이번 달 예산 기준선을 잡을 수 있어요.";

  const incomeGapText = useMemo(() => {
    if (!latestEntry?.actual_amount) {
      return "실제 입금액을 입력하면 차이를 계산해드릴게요.";
    }
    if (incomeGap === 0) {
      return "예상한 금액과 똑같이 들어왔어요.";
    }
    const absGap = Math.abs(incomeGap).toLocaleString("ko-KR");
    return incomeGap > 0 ? `예상보다 ${absGap}원 더 들어왔어요.` : `예상보다 ${absGap}원 적게 들어왔어요.`;
  }, [incomeGap, latestEntry?.actual_amount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const created = await apiRequest<IncomeEntry>("/incomes", {
        method: "POST",
        body: JSON.stringify({
          source_name: sourceName,
          source_type: "salary",
          period: `${period}-01`,
          expected_amount: parseMoneyInput(expectedAmount),
          actual_amount: actualAmount ? parseMoneyInput(actualAmount) : null,
          received_at: receivedAt || null,
        }),
      });

      setEntries((currentEntries) => [created, ...currentEntries]);
      setExpectedAmount("");
      setActualAmount("");
      setReceivedAt("");
      setNotice({ tone: "success", text: "수입이 저장됐어요." });
    } catch {
      setNotice({ tone: "error", text: "수입을 저장하지 못했어요." });
    }
  }

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Income</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          수입
        </h1>
        <p className="m-0 text-[#66758c]">이번 달 예상 수입과 실제 입금액을 적어 예산 계산의 기준을 만들어요.</p>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="수입 요약">
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">최근 예상 수입</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={latestExpected} />
          </strong>
        </AppCard>
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">최근 실제 입금액</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={latestActual} />
          </strong>
        </AppCard>
        <AppCard className="bg-[#fdfaf0]">
          <p className="m-0 font-bold text-[#b77818]">예상/실제 차이</p>
          <strong className="mt-3 block text-xl tracking-[-0.04em] text-[#17253f]">{incomeGapText}</strong>
        </AppCard>
        <AppCard className="bg-[#eef8f5]">
          <p className="m-0 font-bold text-[#3b947f]">월 수입 기준선</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={incomeBaseline} />
          </strong>
          <span className="mt-2 block text-sm font-bold text-[#66758c]">{incomeBaselineLabel}</span>
          <p className="m-0 mt-3 text-sm text-[#4c5f7c]">{budgetReflectionText}</p>
        </AppCard>
      </section>

      <section className="grid grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">수입 입력</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 font-bold text-[#17253f]">
              수입원 이름
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              기준 월
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              예상 수입
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                inputMode="numeric"
                value={expectedAmount}
                onChange={(event) => setExpectedAmount(formatMoneyInput(event.target.value))}
                placeholder="예: 2,800,000"
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              실제 입금액
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                inputMode="numeric"
                value={actualAmount}
                onChange={(event) => setActualAmount(formatMoneyInput(event.target.value))}
                placeholder="아직 모르면 비워둬도 돼요"
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              입금 날짜
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                type="date"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
              />
            </label>
            <button className="cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
              수입 저장
            </button>
          </form>
          {notice && (
            <p
              className={`rounded-2xl px-4 py-3 ${
                notice.tone === "error" ? "bg-[#fff1ef] text-[#9f3328]" : "bg-[#eaf1f7] text-[#173b68]"
              }`}
              role={notice.tone === "error" ? "alert" : "status"}
            >
              {notice.text}
            </p>
          )}
        </AppCard>

        <AppCard>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">수입 기록</h2>
          {entries.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#b9c8d8] bg-[#f7faf9] p-6">
              <strong className="block text-lg text-[#173b68]">아직 등록된 수입이 없어요.</strong>
              <p className="m-0 mt-2 text-[#66758c]">첫 수입을 입력하면 예산 계산의 기준선이 생겨요.</p>
            </div>
          ) : (
            <ul className="mt-5 grid list-none gap-3 p-0">
              {entries.map((entry) => (
                <li
                  className="grid gap-4 rounded-3xl border border-[#dfe5e2] bg-[#fbfcfb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={entry.id}
                >
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg text-[#17253f]">{entry.period.slice(0, 7)}</strong>
                      <span className="rounded-full bg-[#eef8f5] px-3 py-1 text-xs font-bold text-[#3b947f]">
                        {formatIncomeDate(entry.received_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#66758c]">
                      <span>
                        예상 <MoneyText amount={Number(entry.expected_amount)} />
                      </span>
                      <span>
                        실제{" "}
                        {entry.actual_amount ? (
                          <MoneyText amount={Number(entry.actual_amount)} />
                        ) : (
                          <strong className="text-[#b77818]">미입력</strong>
                        )}
                      </span>
                    </div>
                  </div>
                  <strong className="text-xl tracking-[-0.04em] text-[#173b68]">
                    <MoneyText amount={Number(entry.actual_amount ?? entry.expected_amount)} />
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </div>
  );
}
