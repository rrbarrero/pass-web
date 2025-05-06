from domain.pass_file import PassFile
from factory import create_gpg_decryptor, decryptor_for_testing
from repos.file_repository import FakeFileRepository
from services.pass_service import PassService


def test_search():
    pass_service = PassService(FakeFileRepository(), create_gpg_decryptor())

    current = pass_service.search("other")

    assert current == [PassFile.from_path("other.ci")]


def test_get_password():
    pass_service = PassService(FakeFileRepository(), decryptor_for_testing())

    file = PassFile.from_path("tests/__fixtures__/expected.txt.gpg")

    current = pass_service.get_password(file)

    assert current == "green!"
