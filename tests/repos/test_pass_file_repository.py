from config import Settings
from repos.file_repository import PassFileRepository


def test_search():
    repository = PassFileRepository(str(Settings.fixtures_path))

    current = repository.search_file("expected")

    assert "tests/__fixtures__/expected.txt.gpg" in current[0]


def test_search_not_found():
    repository = PassFileRepository(str(Settings.fixtures_path))

    current = repository.search_file("not_found")

    assert current == []
