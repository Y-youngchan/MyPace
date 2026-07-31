import argparse
import sys
from pathlib import Path
from uuid import UUID

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal, engine
from app.models.entities import Base
from app.repositories.finance_repository import FinanceRepository
from app.routers.mock_banking import build_demo_transactions
from app.schemas.finance import TransactionCreate

DEMO_USER_ID = UUID("00000000-0000-4000-8000-000000000001")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--persona", choices=["worker", "student"], required=True)
    parser.add_argument("--period", required=True)
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        repository = FinanceRepository(db)
        inserted = 0
        for row in build_demo_transactions(args.persona, args.period):
            if repository.get_transaction_by_external_id(DEMO_USER_ID, row["external_id"]):
                continue
            repository.create_transaction(
                DEMO_USER_ID,
                TransactionCreate(
                    amount=row["amount"],
                    kind=row["kind"],
                    occurred_at=row["occurred_at"],
                    description=row["description"],
                    category_name=row["category_name"],
                ),
                is_synthetic=True,
                external_id=row["external_id"],
            )
            inserted += 1
    print(f"Inserted {inserted} demo rows for {args.persona} {args.period}.")


if __name__ == "__main__":
    main()
