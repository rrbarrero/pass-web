from pathlib import PosixPath
from config import settings, Environment
from web.auth import verify_password

def test_config_default():
    
    assert settings.env == Environment.TESTING
    assert settings.admin_username == "admin"
    assert verify_password(plain_password="testing", hashed_password=settings.admin_password)
    assert settings.jwt_secret_key == "e6bccc025f81b0f739faa9eb4cfc95b2431b68fbbddf7a21e277edec786271bb"
    assert settings.jwt_algorithm == "HS256"
    assert isinstance(settings.config_path, PosixPath)
    assert isinstance(settings.fixtures_path, PosixPath)
    assert settings.cors_allow == ['http://localhost:3000']
    assert "tests/__fixtures__" in settings.password_store_path