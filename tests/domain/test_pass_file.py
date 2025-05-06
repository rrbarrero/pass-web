from pathlib import Path
from domain.pass_file import PassFile


def test_from_path():
    current = PassFile.from_path("tests/test.pass")

    assert current.file_name == "test.pass"
    assert current.full_path == Path("tests/test.pass")
