from fastapi import HTTPException, status
import pytest
from web.auth import get_current_user, verify_password, create_access_token
from jose import jwt
from src.config import settings


def test_verify_password():
    assert verify_password(
        "testing", "$2b$12$ysh25BtJwvVtrUuHxdM36.Vq8qXf3EmEc4kc0pwxakmi1KrZuxfCW"
    )


def test_create_access_token():
    current = create_access_token({"key": "value"})

    assert isinstance(current, str)
    assert len(current) > 0

    data = jwt.decode(
        current, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
    )

    assert data["key"] == "value"
    assert data["exp"] > 0


@pytest.mark.asyncio
async def test_get_current_user():
    valid_username = "admin"
    token = create_access_token(data={"sub": valid_username})

    returned_username = await get_current_user(token=token)

    assert returned_username == valid_username


@pytest.mark.asyncio
async def test_get_current_user_wrong_username():
    wrong_username = "nottheadmin"
    token = create_access_token(data={"sub": wrong_username})

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in exc_info.value.detail
    assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}
