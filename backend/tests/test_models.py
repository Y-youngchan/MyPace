from app.models.entities import Base


def test_required_tables_are_registered() -> None:
    assert set(Base.metadata.tables) >= {
        "profiles",
        "income_sources",
        "income_entries",
        "financial_accounts",
        "categories",
        "transactions",
        "budgets",
        "budget_items",
        "ai_insights",
        "monthly_reports",
    }
