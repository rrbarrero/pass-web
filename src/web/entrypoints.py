from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from domain.pass_file import PassFile
from factory import create_gpg_decryptor, create_pass_file_repository
from repos.gpg_decryptor import GPGDecryptionError, GPGFileNotFoundError
from services.pass_service import PassService
from web.adapters import FilesUiAdapter
from web.auth import Token, create_access_token, get_current_user, verify_password

from config import settings
from web.entities import DecryptData

api_router = APIRouter()


async def create_pass_service_with() -> PassService:
    return PassService(create_pass_file_repository(), create_gpg_decryptor())


@api_router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    is_admin_user = form_data.username == settings.admin_username

    password_ok = verify_password(form_data.password, settings.admin_password)

    if not is_admin_user or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.jwt_expiration)
    access_token = create_access_token(
        data={"sub": settings.admin_username},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@api_router.get("/search/{needle}")
async def search_file(
    needle: str,
    _: Annotated[str, Depends(get_current_user)],
    pass_service: Annotated[PassService, Depends(create_pass_service_with)],
) -> list[dict[str, str]]:
    return FilesUiAdapter(pass_service.search(needle)).adapt()


@api_router.post("/decrypt")
async def decrypt_file(
    decrypt_data: DecryptData,
    _: Annotated[str, Depends(get_current_user)],
    pass_service: Annotated[PassService, Depends(create_pass_service_with)],
) -> dict[str, str]:
    try:
        return {
            "content": pass_service.get_password(
                file=PassFile.from_path(decrypt_data.fullPath),
                gpg_secret_passphrase=decrypt_data.gpgSecretPassphrase,
            )
        }
    except GPGFileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    except GPGDecryptionError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error decrypting file. Is it passphrase correct?",
        )
