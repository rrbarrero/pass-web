from config import settings, Environment
from web.auth import verify_password

def test_config_default():
    
    assert settings.env == Environment.TESTING
    assert settings.admin_username == "admin"
    print(settings.admin_password)
    assert verify_password(settings.admin_password, "testing")