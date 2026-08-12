from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import (
    ActualIncomeAdjustmentRequest,
    ActualIncomeAdjustmentResponse,
    BudgetRecommendationRequest,
    BudgetRecommendationResponse,
    BudgetResponse,
    BudgetUpsert,
)
from app.services.budget_service import recommend_budget, recalculate_after_actual_income

router = APIRouter(prefix="/api/v1/budgets", tags=["budgets"])


@router.post("/recommend", response_model=BudgetRecommendationResponse)
def recommend_budget_endpoint(
    request: BudgetRecommendationRequest,
    _current_user: CurrentUser = Depends(get_current_user),
) -> BudgetRecommendationResponse:
    recommendation = recommend_budget(
        persona=request.persona,
        expected_income=request.expected_income,
        fixed_expenses=request.fixed_expenses,
        category_history=request.category_history,
    )
    return BudgetRecommendationResponse(
        persona=recommendation.persona,
        base_income=recommendation.base_income,
        items=recommendation.items,
        total=recommendation.total,
    )


@router.get("/{period}", response_model=BudgetResponse)
def get_budget_endpoint(
    period: date,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetResponse:
    budget = FinanceRepository(db).get_budget(current_user.user_id, period)
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="저장된 예산이 없습니다.")

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        period=budget.period,
        basis_income_amount=budget.basis_income_amount,
        status=budget.status,
        items={item.category.name: item.adjusted_amount for item in budget.items},
    )


@router.put("/{period}", response_model=BudgetResponse)
def upsert_budget_endpoint(
    period: date,
    request: BudgetUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetResponse:
    total = sum((item.amount for item in request.items), Decimal("0"))
    if total > request.basis_income_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="예산 총액은 기준 수입을 넘을 수 없습니다.",
        )

    budget = FinanceRepository(db).upsert_budget(current_user.user_id, period, request)
    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        period=budget.period,
        basis_income_amount=budget.basis_income_amount,
        status=budget.status,
        items={item.category.name: item.adjusted_amount for item in budget.items},
    )


@router.post("/{period}/apply-actual-income", response_model=ActualIncomeAdjustmentResponse)
def apply_actual_income_endpoint(
    _period: date,
    request: ActualIncomeAdjustmentRequest,
    _current_user: CurrentUser = Depends(get_current_user),
) -> ActualIncomeAdjustmentResponse:
    adjustment = recalculate_after_actual_income(
        expected_income=request.expected_income,
        actual_income=request.actual_income,
        spent=request.spent,
        remaining_required=request.remaining_required,
        remaining_savings=request.remaining_savings,
        remaining_discretionary=request.remaining_discretionary,
        remaining_days=request.remaining_days,
    )
    return ActualIncomeAdjustmentResponse(**adjustment.__dict__)
