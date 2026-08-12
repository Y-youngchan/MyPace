import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import AppCard from "../components/common/AppCard";
import MoneyText from "../components/common/MoneyText";
import type { CategoryEntry, TransactionEntry, TransactionListResponse } from "../types/api";
import { formatMoneyInput, parseMoneyInput } from "../utils/moneyInput";

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

type TransactionKindFilter = "all" | "expense" | "income";
type CategoryInputMode = "saved" | "manual";

type TransactionNotice = {
  tone: "success" | "error";
  text: string;
} | null;

function formatTransactionDate(value: string) {
  return value.slice(0, 10);
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getSignedAmount(transaction: TransactionEntry) {
  const amount = Number(transaction.amount);
  return transaction.kind === "expense" ? -amount : amount;
}

function getFirstCategoryName(categories: CategoryEntry[], kind: TransactionEntry["kind"]) {
  return categories.find((category) => category.kind === kind)?.name || "";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [kindFilter, setKindFilter] = useState<TransactionKindFilter>("all");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [categoryInputMode, setCategoryInputMode] = useState<CategoryInputMode>("saved");
  const [occurredAt, setOccurredAt] = useState(today);
  const [categoryName, setCategoryName] = useState("식비");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState<TransactionNotice>(null);

  useEffect(() => {
    const monthRange = getMonthRange(selectedMonth);

    apiRequest<TransactionListResponse>(`/transactions?start=${monthRange.start}&end=${monthRange.end}`)
      .then((response) => setTransactions(response.items))
      .catch(() => setNotice({ tone: "error", text: "거래내역을 불러오지 못했어요." }));
  }, [selectedMonth]);

  useEffect(() => {
    apiRequest<CategoryEntry[]>("/categories")
      .then((response) => {
        setCategories(response);
        setCategoryName((currentCategoryName) => currentCategoryName || getFirstCategoryName(response, kind));
      })
      .catch(() => setNotice({ tone: "error", text: "카테고리 목록을 불러오지 못했어요." }));
  }, [kind]);

  const filteredCategories = useMemo(() => categories.filter((category) => category.kind === kind), [categories, kind]);

  const visibleTransactions = useMemo(() => {
    if (kindFilter === "all") {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.kind === kindFilter);
  }, [kindFilter, transactions]);

  const summary = useMemo(() => {
    return visibleTransactions.reduce(
      (totals, transaction) => {
        const transactionAmount = Number(transaction.amount);
        if (transaction.kind === "income") {
          return { ...totals, income: totals.income + transactionAmount };
        }
        return { ...totals, expense: totals.expense + transactionAmount };
      },
      { income: 0, expense: 0 },
    );
  }, [visibleTransactions]);

  function resetForm() {
    setEditingTransactionId(null);
    setKind("expense");
    setCategoryInputMode("saved");
    setOccurredAt(today);
    setCategoryName(getFirstCategoryName(categories, "expense") || "식비");
    setAmount("");
    setDescription("");
  }

  function handleStartEdit(transaction: TransactionEntry) {
    setEditingTransactionId(transaction.id);
    setKind(transaction.kind);
    setOccurredAt(formatTransactionDate(transaction.occurred_at));
    setCategoryName(transaction.category_name || "미분류");
    setCategoryInputMode(categories.some((category) => category.kind === transaction.kind && category.name === transaction.category_name) ? "saved" : "manual");
    setAmount(formatMoneyInput(String(Number(transaction.amount))));
    setDescription(transaction.description);
    setNotice(null);
  }

  function handleKindChange(nextKind: TransactionEntry["kind"]) {
    setKind(nextKind);
    if (categoryInputMode === "saved") {
      setCategoryName(getFirstCategoryName(categories, nextKind));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const transactionPayload = {
        amount: parseMoneyInput(amount),
        kind,
        occurred_at: occurredAt,
        description,
        category_name: categoryName,
      };
      const saved = await apiRequest<TransactionEntry>(editingTransactionId ? `/transactions/${editingTransactionId}` : "/transactions", {
        method: editingTransactionId ? "PUT" : "POST",
        body: JSON.stringify(transactionPayload),
      });

      setTransactions((currentTransactions) => {
        if (editingTransactionId) {
          return currentTransactions.map((transaction) => (transaction.id === editingTransactionId ? saved : transaction));
        }

        return [saved, ...currentTransactions];
      });
      resetForm();
      setNotice({ tone: "success", text: editingTransactionId ? "거래가 수정됐어요." : "거래가 저장됐어요." });
    } catch {
      setNotice({ tone: "error", text: editingTransactionId ? "거래를 수정하지 못했어요." : "거래를 저장하지 못했어요." });
    }
  }

  async function handleDelete(transaction: TransactionEntry) {
    if (!window.confirm("이 거래를 삭제할까요?")) {
      return;
    }

    try {
      await apiRequest(`/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      setTransactions((currentTransactions) => currentTransactions.filter((currentTransaction) => currentTransaction.id !== transaction.id));
      if (editingTransactionId === transaction.id) {
        resetForm();
      }
      setNotice({ tone: "success", text: "거래가 삭제됐어요." });
    } catch {
      setNotice({ tone: "error", text: "거래를 삭제하지 못했어요." });
    }
  }

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Transactions</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          거래내역
        </h1>
        <p className="m-0 text-[#66758c]">오늘 쓴 돈과 들어온 돈을 직접 기록해서 예산 사용률의 기준을 만들어요.</p>
      </header>

      <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1" aria-label="거래 요약">
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">총 수입 거래</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">
            <MoneyText amount={summary.income} />
          </strong>
        </AppCard>
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">총 지출 거래</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#9f3328]">
            <MoneyText amount={summary.expense} />
          </strong>
        </AppCard>
        <AppCard className="bg-[#eef8f5]">
          <p className="m-0 font-bold text-[#3b947f]">기록된 거래 수</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">{visibleTransactions.length}건</strong>
        </AppCard>
      </section>

      <section className="grid grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">
              {editingTransactionId ? "거래 수정" : "거래 입력"}
            </h2>
            {editingTransactionId && (
              <button
                className="cursor-pointer rounded-full border-0 bg-[#eaf1f7] px-4 py-2 text-sm font-extrabold text-[#173b68]"
                onClick={resetForm}
                type="button"
              >
                새 거래 입력
              </button>
            )}
          </div>
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <fieldset className="grid gap-3 border-0 p-0">
              <legend className="font-bold text-[#17253f]">구분</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 font-bold text-[#17253f]">
                  <input
                    className="mr-2 accent-[#173b68]"
                    checked={kind === "expense"}
                    name="kind"
                    onChange={() => handleKindChange("expense")}
                    type="radio"
                    value="expense"
                  />
                  지출
                </label>
                <label className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 font-bold text-[#17253f]">
                  <input
                    className="mr-2 accent-[#173b68]"
                    checked={kind === "income"}
                    name="kind"
                    onChange={() => handleKindChange("income")}
                    type="radio"
                    value="income"
                  />
                  수입
                </label>
              </div>
            </fieldset>
            <label className="grid gap-2 font-bold text-[#17253f]">
              날짜
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                type="date"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              카테고리 입력 방식
              <select
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                value={categoryInputMode}
                onChange={(event) => {
                  const nextMode = event.target.value as CategoryInputMode;
                  setCategoryInputMode(nextMode);
                  if (nextMode === "saved") {
                    setCategoryName(getFirstCategoryName(categories, kind));
                  } else {
                    setCategoryName("");
                  }
                }}
              >
                <option value="saved">저장된 카테고리에서 선택</option>
                <option value="manual">직접 입력</option>
              </select>
            </label>
            {categoryInputMode === "saved" ? (
              <label className="grid gap-2 font-bold text-[#17253f]">
                카테고리 선택
                <select
                  className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  required
                >
                  {filteredCategories.length === 0 ? (
                    <option value="">카테고리 페이지에서 먼저 추가해주세요</option>
                  ) : (
                    filteredCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            ) : (
              <label className="grid gap-2 font-bold text-[#17253f]">
                직접 입력 카테고리
                <input
                  className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="예: 식비, 교통, 생활"
                  required
                />
              </label>
            )}
            <label className="grid gap-2 font-bold text-[#17253f]">
              금액
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
                placeholder="예: 12,000"
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-[#17253f]">
              메모
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="예: 점심 식사"
                required
              />
            </label>
            <button className="cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
              {editingTransactionId ? "거래 수정 저장" : "거래 저장"}
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
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">최근 거래</h2>
              <p className="m-0 mt-2 text-sm font-bold text-[#66758c]">월별로 거래를 확인하고 수입·지출만 따로 볼 수 있어요.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#17253f]">
                조회 월
                <input
                  className="min-w-0 rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#17253f]">
                거래 구분 필터
                <select
                  className="min-w-0 rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value as TransactionKindFilter)}
                >
                  <option value="all">전체</option>
                  <option value="expense">지출</option>
                  <option value="income">수입</option>
                </select>
              </label>
            </div>
          </div>
          {visibleTransactions.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#b9c8d8] bg-[#f7faf9] p-6">
              <strong className="block text-lg text-[#173b68]">조건에 맞는 거래가 없어요.</strong>
              <p className="m-0 mt-2 text-[#66758c]">조회 월이나 거래 구분을 바꾸거나 새 거래를 입력해보세요.</p>
            </div>
          ) : (
            <ul className="mt-5 grid list-none gap-3 p-0">
              {visibleTransactions.map((transaction) => (
                <li
                  className="grid gap-4 rounded-3xl border border-[#dfe5e2] bg-[#fbfcfb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={transaction.id}
                >
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg text-[#17253f]">{transaction.description || "메모 없는 거래"}</strong>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          transaction.kind === "expense" ? "bg-[#fff1ef] text-[#9f3328]" : "bg-[#eef8f5] text-[#3b947f]"
                        }`}
                      >
                        {transaction.kind === "expense" ? "지출" : "수입"}
                      </span>
                      {transaction.category_name && (
                        <span className="rounded-full bg-[#eaf1f7] px-3 py-1 text-xs font-bold text-[#173b68]">
                          {transaction.category_name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#66758c]">{formatTransactionDate(transaction.occurred_at)}</span>
                  </div>
                  <div className="grid justify-items-start gap-3 sm:justify-items-end">
                    <strong
                      className={`text-xl tracking-[-0.04em] ${
                        transaction.kind === "expense" ? "text-[#9f3328]" : "text-[#173b68]"
                      }`}
                    >
                      <MoneyText amount={getSignedAmount(transaction)} />
                    </strong>
                    <div className="flex gap-2">
                      <button
                        aria-label={`${transaction.description || "메모 없는 거래"} 수정`}
                        className="cursor-pointer rounded-full border-0 bg-[#eaf1f7] px-3 py-2 text-sm font-extrabold text-[#173b68]"
                        onClick={() => handleStartEdit(transaction)}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        aria-label={`${transaction.description || "메모 없는 거래"} 삭제`}
                        className="cursor-pointer rounded-full border-0 bg-[#fff1ef] px-3 py-2 text-sm font-extrabold text-[#9f3328]"
                        onClick={() => handleDelete(transaction)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </section>
    </div>
  );
}
