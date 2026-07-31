from app.models.entities import Base
from app.models.entities import Profile


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


def test_profile_tracks_supported_auth_providers() -> None:
    assert set(Profile.__table__.columns.keys()) >= {
        "email",
        "primary_auth_provider",
        "auth_providers",
    }
