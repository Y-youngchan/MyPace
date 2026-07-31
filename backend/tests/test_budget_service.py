from decimal import Decimal

import pytest

from app.services.budget_service import (
    recommend_budget,
    recalculate_after_actual_income,
)


def test_worker_recommendation_totals_equal_base_income() -> None:
    result = recommend_budget(
        persona="worker",
        expected_income=Decimal("2800000"),
        fixed_expenses=Decimal("900000"),
        category_history={
            "식비": Decimal("420000"),
            "교통": Decimal("120000"),
            "여가": Decimal("260000"),
        },
    )

    assert result.total == Decimal("2800000")
    assert result.items["필수지출"] == Decimal("900000")
    assert result.items["저축"] == Decimal("560000")
    assert result.items["예비비"] >= Decimal("0")


def test_student_recommendation_uses_lower_savings_ratio() -> None:
    result = recommend_budget(
        persona="student",
        expected_income=Decimal("900000"),
        fixed_expenses=Decimal("250000"),
        category_history={"식비": Decimal("260000"), "교통": Decimal("80000")},
    )

    assert result.total == Decimal("900000")
    assert result.items["저축"] == Decimal("90000")
    assert sum(result.items.values()) == Decimal("900000")


def test_recommendation_rejects_negative_inputs() -> None:
    with pytest.raises(ValueError):
        recommend_budget(
            persona="worker",
            expected_income=Decimal("1000000"),
            fixed_expenses=Decimal("-1"),
            category_history={},
        )


def test_lower_actual_income_reduces_discretionary_first() -> None:
    result = recalculate_after_actual_income(
        expected_income=Decimal("2350000"),
        actual_income=Decimal("2300000"),
        spent=Decimal("900000"),
        remaining_required=Decimal("800000"),
        remaining_savings=Decimal("300000"),
        remaining_discretionary=Decimal("350000"),
        remaining_days=10,
    )

    assert result.adjusted_required == Decimal("800000")
    assert result.adjusted_savings == Decimal("300000")
    assert result.adjusted_discretionary == Decimal("300000")
    assert result.daily_available == Decimal("30000")


def test_lower_actual_income_never_reduces_already_spent_money() -> None:
    result = recalculate_after_actual_income(
        expected_income=Decimal("1000000"),
        actual_income=Decimal("700000"),
        spent=Decimal("680000"),
        remaining_required=Decimal("200000"),
        remaining_savings=Decimal("80000"),
        remaining_discretionary=Decimal("40000"),
        remaining_days=5,
    )

    assert result.available_after_spent == Decimal("20000")
    assert result.adjusted_required == Decimal("20000")
    assert result.adjusted_savings == Decimal("0")
    assert result.adjusted_discretionary == Decimal("0")
    assert result.daily_available == Decimal("0")


def test_zero_remaining_days_returns_zero_daily_available() -> None:
    result = recalculate_after_actual_income(
        expected_income=Decimal("1000000"),
        actual_income=Decimal("1000000"),
        spent=Decimal("500000"),
        remaining_required=Decimal("200000"),
        remaining_savings=Decimal("100000"),
        remaining_discretionary=Decimal("200000"),
        remaining_days=0,
    )

    assert result.daily_available == Decimal("0")
