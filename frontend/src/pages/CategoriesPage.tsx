import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../api/client";
import AppCard from "../components/common/AppCard";
import type { CategoryEntry } from "../types/api";

type CategoryNotice = {
  tone: "success" | "error";
  text: string;
} | null;

type CategoryFilter = "all" | CategoryEntry["kind"];
type CategoryCostType = NonNullable<CategoryEntry["cost_type"]>;

function categoryKindLabel(kind: CategoryEntry["kind"]) {
  return kind === "income" ? "수입" : "지출";
}

function categoryCostTypeLabel(costType: CategoryEntry["cost_type"]) {
  if (costType === "fixed") {
    return "고정비";
  }
  if (costType === "variable") {
    return "변동비";
  }
  return "";
}

const categoryFilters: Array<{ label: string; value: CategoryFilter }> = [
  { label: "전체", value: "all" },
  { label: "지출", value: "expense" },
  { label: "수입", value: "income" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryEntry["kind"]>("expense");
  const [costType, setCostType] = useState<CategoryCostType>("variable");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [notice, setNotice] = useState<CategoryNotice>(null);
  const categoryListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<CategoryEntry[]>("/categories")
      .then(setCategories)
      .catch(() => setNotice({ tone: "error", text: "카테고리 목록을 불러오지 못했어요." }));
  }, []);

  const categorySummary = useMemo(() => {
    return categories.reduce(
      (summary, category) => {
        if (category.kind === "income") {
          return { ...summary, income: summary.income + 1 };
        }
        return { ...summary, expense: summary.expense + 1 };
      },
      { income: 0, expense: 0 },
    );
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (categoryFilter === "all") {
      return categories;
    }
    return categories.filter((category) => category.kind === categoryFilter);
  }, [categories, categoryFilter]);

  function resetForm() {
    setEditingCategoryId(null);
    setName("");
    setKind("expense");
    setCostType("variable");
  }

  function handleStartEdit(category: CategoryEntry) {
    setEditingCategoryId(category.id);
    setName(category.name);
    setKind(category.kind);
    setCostType(category.cost_type || "variable");
    setNotice(null);
  }

  function handleKindChange(nextKind: CategoryEntry["kind"]) {
    setKind(nextKind);
    if (nextKind === "income") {
      setCostType("variable");
    }
  }

  function handleChangeCategoryFilter(nextFilter: CategoryFilter) {
    setCategoryFilter(nextFilter);
    if (categoryListRef.current) {
      categoryListRef.current.scrollTop = 0;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      kind,
      cost_type: kind === "expense" ? costType : null,
    };

    try {
      const saved = await apiRequest<CategoryEntry>(editingCategoryId ? `/categories/${editingCategoryId}` : "/categories", {
        method: editingCategoryId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setCategories((currentCategories) => {
        if (editingCategoryId) {
          return currentCategories.map((category) => (category.id === editingCategoryId ? saved : category));
        }
        return [...currentCategories, saved];
      });
      resetForm();
      setNotice({ tone: "success", text: editingCategoryId ? "카테고리가 수정됐어요." : "카테고리가 저장됐어요." });
    } catch {
      setNotice({ tone: "error", text: editingCategoryId ? "카테고리를 수정하지 못했어요." : "카테고리를 저장하지 못했어요." });
    }
  }

  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Categories</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          카테고리
        </h1>
        <p className="m-0 text-[#66758c]">거래와 예산에 사용할 수입·지출 분류를 미리 정리해요.</p>
      </header>

      <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1" aria-label="카테고리 요약">
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">전체 카테고리</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">{categories.length}개</strong>
        </AppCard>
        <AppCard>
          <p className="m-0 font-bold text-[#66758c]">지출 카테고리</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#9f3328]">{categorySummary.expense}개</strong>
        </AppCard>
        <AppCard className="bg-[#eef8f5]">
          <p className="m-0 font-bold text-[#3b947f]">수입 카테고리</p>
          <strong className="mt-3 block text-3xl tracking-[-0.04em] text-[#173b68]">{categorySummary.income}개</strong>
        </AppCard>
      </section>

      <section className="grid items-start grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] gap-[18px] max-[1100px]:grid-cols-1">
        <AppCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">
              {editingCategoryId ? "카테고리 수정" : "카테고리 추가"}
            </h2>
            {editingCategoryId && (
              <button
                className="cursor-pointer rounded-full border-0 bg-[#eaf1f7] px-4 py-2 text-sm font-extrabold text-[#173b68]"
                onClick={resetForm}
                type="button"
              >
                새 카테고리 입력
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
              카테고리 이름
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 식비, 교통, 월급"
                required
              />
            </label>

            {kind === "expense" && (
              <fieldset className="grid gap-3 border-0 p-0">
                <legend className="font-bold text-[#17253f]">비용 성격</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 font-bold text-[#17253f]">
                    <input
                      className="mr-2 accent-[#173b68]"
                      checked={costType === "fixed"}
                      name="costType"
                      onChange={() => setCostType("fixed")}
                      type="radio"
                      value="fixed"
                    />
                    고정비
                  </label>
                  <label className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 font-bold text-[#17253f]">
                    <input
                      className="mr-2 accent-[#173b68]"
                      checked={costType === "variable"}
                      name="costType"
                      onChange={() => setCostType("variable")}
                      type="radio"
                      value="variable"
                    />
                    변동비
                  </label>
                </div>
                <p className="m-0 text-sm font-bold leading-6 text-[#66758c]">
                  매달 거의 자동으로 빠져나가는 돈은 고정비, 그때그때 쓰는 돈은 변동비로 보면 돼요.
                </p>
              </fieldset>
            )}

            <button className="cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
              {editingCategoryId ? "카테고리 수정 저장" : "카테고리 저장"}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">카테고리 목록</h2>
            <div className="flex rounded-[20px] bg-[#eaf1f7] p-1" aria-label="카테고리 목록 필터">
              {categoryFilters.map((filter) => {
                const isSelected = categoryFilter === filter.value;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`cursor-pointer rounded-2xl border-0 px-4 py-2 text-sm font-extrabold transition ${
                      isSelected ? "bg-[#173b68] text-white shadow-[0_8px_18px_rgba(23,59,104,0.18)]" : "bg-transparent text-[#4c5f7c]"
                    }`}
                    key={filter.value}
                    onClick={() => handleChangeCategoryFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
          {categories.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#b9c8d8] bg-[#f7faf9] p-6">
              <strong className="block text-lg text-[#173b68]">아직 카테고리가 없어요.</strong>
              <p className="m-0 mt-2 text-[#66758c]">자주 쓰는 분류를 먼저 만들어두면 거래 입력이 쉬워져요.</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#b9c8d8] bg-[#f7faf9] p-6">
              <strong className="block text-lg text-[#173b68]">해당 구분의 카테고리가 없어요.</strong>
              <p className="m-0 mt-2 text-[#66758c]">필요하면 왼쪽에서 새 카테고리를 추가해보세요.</p>
            </div>
          ) : (
            <div
              aria-label="스크롤 가능한 카테고리 목록"
              className="mt-5 max-h-[520px] overflow-y-auto pr-2 max-[1100px]:max-h-[460px]"
              ref={categoryListRef}
            >
              <ul className="grid list-none gap-3 p-0">
                {filteredCategories.map((category) => (
                  <li
                    className="grid gap-4 rounded-3xl border border-[#dfe5e2] bg-[#fbfcfb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={category.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg text-[#17253f]">{category.name}</strong>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          category.kind === "expense" ? "bg-[#fff1ef] text-[#9f3328]" : "bg-[#eef8f5] text-[#3b947f]"
                        }`}
                      >
                        {categoryKindLabel(category.kind)}
                      </span>
                      {category.kind === "expense" && category.cost_type && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            category.cost_type === "fixed" ? "bg-[#eaf1f7] text-[#173b68]" : "bg-[#f4f0ff] text-[#5b4a9c]"
                          }`}
                        >
                          {categoryCostTypeLabel(category.cost_type)}
                        </span>
                      )}
                    </div>
                    <button
                      aria-label={`${category.name} 수정`}
                      className="w-fit cursor-pointer rounded-full border-0 bg-[#eaf1f7] px-3 py-2 text-sm font-extrabold text-[#173b68] sm:justify-self-end"
                      onClick={() => handleStartEdit(category)}
                      type="button"
                    >
                      수정
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AppCard>
      </section>
    </div>
  );
}
