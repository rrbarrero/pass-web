import glob
from typing import Protocol


class FileRepository(Protocol):
    def search_file(self, needle: str) -> list[str]: ...


class FakeFileRepository:
    def __init__(self, initial_content: list[str] | None = None):
        self.params = None
        self.initial_content = initial_content or [
            "folder_a/file1.ciao",
            "folder_b/subfolder_c/file2.bla",
            "folder_i/file3.hola",
            "other.ci",
            "expected.txt.gpg",
        ]

    def search_file(self, needle: str) -> list[str]:
        self.params = needle
        return [path for path in self.initial_content if needle in path]


class PassFileRepository:
    def __init__(self, base_path: str):
        self.base_path = base_path

    def search_file(self, needle: str) -> list[str]:
        return [
            path
            for path in glob.glob(f"{self.base_path}**/*{needle}*.gpg", recursive=True)
        ]
