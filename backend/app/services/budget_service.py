from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

WHOLE_WON = Decimal("1")


@dataclass(frozen=True)
class BudgetRecommendation:
    persona: Literal["worker", "student"]
    base_income: Decimal
    items: dict[str, Decimal]
    total: Decimal


@dataclass(frozen=True)
class ActualIncomeAdjustment:
    expected_income: Decimal
    actual_income: Decimal
    income_gap: Decimal
    spent: Decimal
    available_after_spent: Decimal
    adjusted_required: Decimal
    adjusted_savings: Decimal
    adjusted_discretionary: Decimal
    daily_available: Decimal


def recommend_budget(
    *,
    persona: Literal["worker", "student"],
    expected_income: Decimal,
    fixed_expenses: Decimal,
    category_history: dict[str, Decimal],
) -> BudgetRecommendation:
    base_income = _won(expected_income)
    required = _won(fixed_expenses)
    _reject_negative(base_income, required, *category_history.values())
    if required > base_income:
        raise ValueError("fixed_expenses cannot exceed expected_income")

    remaining = base_income - required
    savings_ratio = Decimal("0.20") if persona == "worker" else Decimal("0.10")
    savings = min(_won(base_income * savings_ratio), remaining)
    remaining -= savings

    history_total = sum((_won(value) for value in category_history.values()), Decimal("0"))
    discretionary_pool = remaining
    items: dict[str, Decimal] = {
        "필수지출": required,
        "저축": savings,
    }

    if category_history and history_total > 0:
        allocated = Decimal("0")
        categories = list(category_history.items())
        for index, (name, value) in enumerate(categories):
            if index == len(categories) - 1:
                amount = discretionary_pool - allocated
            else:
                amount = _won(discretionary_pool * (_won(value) / history_total))
                allocated += amount
            items[name] = amount
    else:
        items["생활비"] = discretionary_pool

    current_total = sum(items.values(), Decimal("0"))
    items["예비비"] = base_income - current_total

    return BudgetRecommendation(
        persona=persona,
        base_income=base_income,
        items=items,
        total=sum(items.values(), Decimal("0")),
    )


def recalculate_after_actual_income(
    *,
    expected_income: Decimal,
    actual_income: Decimal,
    spent: Decimal,
    remaining_required: Decimal,
    remaining_savings: Decimal,
    remaining_discretionary: Decimal,
    remaining_days: int,
) -> ActualIncomeAdjustment:
    expected = _won(expected_income)
    actual = _won(actual_income)
    spent_amount = _won(spent)
    required = _won(remaining_required)
    savings = _won(remaining_savings)
    discretionary = _won(remaining_discretionary)
    _reject_negative(expected, actual, spent_amount, required, savings, discretionary)
    if remaining_days < 0:
        raise ValueError("remaining_days cannot be negative")

    available_after_spent = max(actual - spent_amount, Decimal("0"))
    required = min(required, available_after_spent)
    remaining_after_required = available_after_spent - required

    if actual < expected:
        savings = min(savings, remaining_after_required)
        remaining_after_savings = remaining_after_required - savings
        discretionary = min(discretionary, remaining_after_savings)
    else:
        savings = min(savings, remaining_after_required)
        remaining_after_savings = remaining_after_required - savings
        discretionary = min(discretionary, remaining_after_savings)

    daily_available = Decimal("0") if remaining_days == 0 else _won(discretionary / Decimal(remaining_days))

    return ActualIncomeAdjustment(
        expected_income=expected,
        actual_income=actual,
        income_gap=actual - expected,
        spent=spent_amount,
        available_after_spent=available_after_spent,
        adjusted_required=required,
        adjusted_savings=savings,
        adjusted_discretionary=discretionary,
        daily_available=daily_available,
    )


def _won(value: Decimal) -> Decimal:
    return Decimal(value).quantize(WHOLE_WON, rounding=ROUND_HALF_UP)


def _reject_negative(*values: Decimal) -> None:
    if any(value < 0 for value in values):
        raise ValueError("money values cannot be negative")
