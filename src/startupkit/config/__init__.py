"""Typed config. Fail fast on missing required vars in the real impl (use pydantic-settings)."""

import os


class Config:
    database_url: str = os.environ.get("DATABASE_URL", "")
    temporal_address: str = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")


config = Config()
