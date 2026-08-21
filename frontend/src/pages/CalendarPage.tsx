import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";
import type { CalendarEvent } from "../types/api";

const currentPeriod = new Date().toISOString().slice(0, 7);
const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthDays(period: string) {
  const [year, month] = period.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const blanks = Array.from({ length: firstDay }, () => null);
  const days = Array.from({ length: lastDate }, (_, index) => index + 1);

  return [...blanks, ...days];
}

function formatDay(period: string, day: number) {
  return `${period}-${String(day).padStart(2, "0")}`;
}

function eventTone(eventType: CalendarEvent["event_type"]) {
  if (eventType === "income") {
    return "bg-[#eef8f5] text-[#267866]";
  }
  if (eventType === "expense") {
    return "bg-[#fff3ef] text-[#a44834]";
  }
  return "bg-[#fdfaf0] text-[#b77818]";
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setNotice(null);
    apiRequest<CalendarEvent[]>(`/calendar/events?period=${selectedPeriod}`)
      .then((response) => setEvents(response))
      .catch(() => setNotice("캘린더 일정을 불러오지 못했어요. 로그인/서버 연결을 확인해주세요."));
  }, [selectedPeriod]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((groupedEvents, event) => {
      groupedEvents[event.event_date] = [...(groupedEvents[event.event_date] ?? []), event];
      return groupedEvents;
    }, {});
  }, [events]);

  const incomeTotal = events
    .filter((event) => event.event_type === "income")
    .reduce((total, event) => total + Number(event.amount ?? 0), 0);
  const expenseTotal = events
    .filter((event) => event.event_type === "expense")
    .reduce((total, event) => total + Number(event.amount ?? 0), 0);
  const monthDays = getMonthDays(selectedPeriod);

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Calendar</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          캘린더
        </h1>
        <p className="m-0 text-[#66758c]">월급일, 지출일, 예산 흐름을 달력으로 확인해요.</p>
      </header>

      <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1" aria-label="캘린더 요약">
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">이번 달 돈 일정</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">{events.length}개</strong>
        </AppCard>
        <AppCard className="bg-[#eef8f5]">
          <p className="m-0 font-bold text-[#267866]">예정/등록 수입</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={incomeTotal} />
          </strong>
        </AppCard>
        <AppCard className="bg-[#fff3ef]">
          <p className="m-0 font-bold text-[#a44834]">등록 지출</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={expenseTotal} />
          </strong>
        </AppCard>
      </section>

      {notice && (
        <p className="rounded-2xl bg-[#fff1ef] px-4 py-3 text-[#9f3328]" role="alert">
          {notice}
        </p>
      )}

      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#b77818] uppercase">
              Money Schedule
            </p>
            <h2 className="m-0 mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">
              {selectedPeriod.replace("-", "년 ")}월 캘린더
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm font-bold text-[#17253f]">
              조회 월
              <input
                className="min-w-0 rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                onChange={(event) => setSelectedPeriod(event.target.value)}
                type="month"
                value={selectedPeriod}
              />
            </label>
            <span className="rounded-full bg-[#eaf1f7] px-4 py-3 text-sm font-bold text-[#173b68]">DB 데이터 기준</span>
          </div>
        </div>

        {events.length === 0 && !notice ? (
          <div className="mt-5 rounded-3xl border border-dashed border-[#b9c8d8] bg-[#f7faf9] p-6">
            <strong className="block text-lg text-[#173b68]">이번 달 돈 일정이 아직 없어요.</strong>
            <p className="m-0 mt-2 text-[#66758c]">수입이나 거래가 저장되면 이 캘린더에 자동으로 표시돼요.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-7 gap-2 max-[720px]:min-w-[720px]">
            {weekDays.map((day) => (
              <div className="px-2 py-2 text-center text-sm font-extrabold text-[#66758c]" key={day}>
                {day}
              </div>
            ))}
            {monthDays.map((day, index) => {
              const dateKey = day ? formatDay(selectedPeriod, day) : `blank-${index}`;
              const dayEvents = day ? eventsByDate[dateKey] ?? [] : [];

              return (
                <div
                  className={`min-h-[118px] rounded-3xl border border-[#dfe5e2] bg-[#fbfcfb] p-3 ${
                    day ? "" : "opacity-35"
                  }`}
                  key={dateKey}
                >
                  {day && <strong className="text-[#173b68]">{day}</strong>}
                  <div className="mt-2 grid gap-1.5">
                    {dayEvents.map((event) => (
                      <div className={`rounded-2xl px-2.5 py-2 text-xs font-bold ${eventTone(event.event_type)}`} key={event.id}>
                        <span className="block">{event.title}</span>
                        {event.amount && (
                          <span className="mt-0.5 block">
                            <MoneyText amount={Number(event.amount)} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppCard>
    </div>
  );
}
