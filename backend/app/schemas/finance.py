from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpsert(BaseModel):
    display_name: str = Field(min_length=1, max_length=40)
    user_type: Literal["worker", "student"]


class ProfileResponse(ProfileUpsert):
    user_id: UUID

    model_config = ConfigDict(from_attributes=True)
