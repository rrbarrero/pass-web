from pathlib import PosixPath
from config import settings, Environment
from web.auth import verify_password

def test_config_default():
    
    assert settings.env == Environment.TESTING
    assert settings.admin_username == "admin"
    assert verify_password(plain_password="testing", hashed_password=settings.admin_password)
    assert settings.jwt_secret_key == "missed jwt secret key"
    assert settings.jwt_algorithm == "HS256"
    assert isinstance(settings.config_path, PosixPath)
    assert isinstance(settings.fixtures_path, PosixPath)
    assert settings.cors_allow == ['*']
    assert "tests/__fixtures__" in settings.password_store_path