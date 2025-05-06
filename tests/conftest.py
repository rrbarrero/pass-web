from fastapi.testclient import TestClient
import pytest
from web.auth import get_current_user
from config import Environment, settings
from main import app


@pytest.fixture(autouse=True)
def set_testing_environment():
    original_env = settings.env
    settings.env = Environment.TESTING
    yield
    settings.env = original_env


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: settings.admin_username
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
