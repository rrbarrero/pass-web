from repos.file_repository import PassFileRepository
from repos.gpg_decryptor import GPGDecryptor, create_gpg_instance
from config import settings


def create_gpg_decryptor() -> GPGDecryptor:
    return GPGDecryptor(
        gpg_instance=create_gpg_instance(),
    )


def decryptor_for_testing() -> GPGDecryptor:
    return GPGDecryptor(create_gpg_instance(str(settings.fixtures_path)))


def create_pass_file_repository() -> PassFileRepository:
    return PassFileRepository(settings.password_store_path)
