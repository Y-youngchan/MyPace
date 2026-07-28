from uuid import UUID

from sqlalchemy.orm import Session

from app.models.entities import Profile
from app.schemas.finance import ProfileUpsert


class FinanceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_profile(self, user_id: UUID) -> Profile | None:
        return self.db.get(Profile, user_id)

    def upsert_profile(self, user_id: UUID, profile_data: ProfileUpsert) -> Profile:
        profile = self.get_profile(user_id)
        if profile is None:
            profile = Profile(
                user_id=user_id,
                display_name=profile_data.display_name,
                user_type=profile_data.user_type,
            )
            self.db.add(profile)
        else:
            profile.display_name = profile_data.display_name
            profile.user_type = profile_data.user_type

        self.db.commit()
        self.db.refresh(profile)
        return profile
