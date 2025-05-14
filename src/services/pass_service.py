from domain.pass_file import PassFile
from repos.file_repository import FileRepository
from repos.gpg_decryptor import GPGDecryptor


class PassService:
    def __init__(self, file_repository: FileRepository, decryptor: GPGDecryptor):
        self.file_repository = file_repository
        self.decryptor = decryptor

    def search(self, needle: str) -> list[PassFile]:
        return [PassFile.from_path(x) for x in self.file_repository.search_file(needle)]

    def get_password(self, file: PassFile, gpg_secret_passphrase: str) -> str:
        return self.decryptor.decrypt_file_to_string(
            encrypted_file_path=str(file.full_path),
            gpg_secret_passphrase=gpg_secret_passphrase,
        )
