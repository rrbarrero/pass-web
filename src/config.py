from dataclasses import dataclass, field
from enum import Enum
import os
from pathlib import Path


class Environment(Enum):
    DEV = "dev"
    PROD = "prod"
    TESTING = "testing"


@dataclass
class Settings:
    env: Environment = field(
        default_factory=lambda: Environment(os.getenv("ENVIRONMENT", "dev"))
    )

    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv(
        "ADMIN_PASSWORD", "$2b$12$ysh25BtJwvVtrUuHxdM36.Vq8qXf3EmEc4kc0pwxakmi1KrZuxfCW"
    )  # testing

    gpg_secret_passphrase: str = os.getenv("GPG_SECRET_PASSPHRASE", "testing")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "missed jwt secret key")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration: int = int(os.getenv("JWT_EXPIRATION", 30))  # 30 minutes

    config_path = Path(__file__).parent.parent.resolve()
    fixtures_path = config_path / "tests/__fixtures__/"

    cors_allow = os.getenv("CORS_ALLOW", "*").split(",")

    @classmethod
    def load(cls):
        return cls()

    @property
    def password_store_path(self) -> str:
        if self.env == Environment.TESTING:
            return str(self.fixtures_path)
        return os.getenv("PASSWORD_STORE_PATH", "/home/user/.password-store/")


settings = Settings.load()
