from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.models.entities import Category
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CategoryResponse]:
    categories = FinanceRepository(db).list_categories_with_defaults(current_user.user_id)
    return [_to_response(category) for category in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    repository = FinanceRepository(db)
    name = category_data.name.strip()
    if repository.category_name_exists(current_user.user_id, name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 카테고리입니다.")

    category = repository.create_category(current_user.user_id, name, category_data.kind, category_data.cost_type)
    return _to_response(category)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    repository = FinanceRepository(db)
    name = category_data.name.strip()
    if repository.category_name_exists(current_user.user_id, name, exclude_category_id=category_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 카테고리입니다.")

    category = repository.update_category(current_user.user_id, category_id, name, category_data.kind, category_data.cost_type)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="카테고리를 찾을 수 없습니다.")
    return _to_response(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = FinanceRepository(db).delete_category(current_user.user_id, category_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="카테고리를 찾을 수 없습니다.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _to_response(category: Category) -> CategoryResponse:
    return CategoryResponse(
        id=category.id,
        user_id=category.user_id,
        name=category.name,
        kind=category.category_type,
        cost_type=category.cost_type,
    )
