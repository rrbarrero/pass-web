from pydantic import ValidationError
import pytest
from config import Environment, settings
from web.entities import DecryptData


@pytest.mark.parametrize(
    "file_name, expected_exception",
    [
        ("valid-file.txt", None),
        ("another.valid-file.gpg", None),
        ("invalid-file/txt", ValidationError),
        ("anotherinvalidfile\\name.gpg", ValidationError),
        ("noextension", ValidationError),
        ("too..many.dots.txt", ValidationError),
    ],
)
def test_validate_file_name(file_name, expected_exception):
    if expected_exception:
        with pytest.raises(expected_exception):
            DecryptData(fileName=file_name, fullPath="valid/path", gpgSecretPassphrase="testing")
    else:
        assert (
            DecryptData(
                fileName=file_name,
                fullPath=f"{settings.password_store_path}valid/path",
                gpgSecretPassphrase="testing",
            ).fileName
            == file_name
        )


def test_validate_full_path():
    settings.env = Environment.TESTING

    test_cases = [
        (f"{settings.password_store_path}/valid-file.txt", None),
        ("/outside/path/valid-file.txt", ValidationError),
        ("../../valid-file.txt", ValidationError),
        ("valid/path/../../valid-file.txt", ValidationError),
    ]

    for full_path, expected_exception in test_cases:
        if expected_exception:
            with pytest.raises(expected_exception):
                DecryptData(fileName="valid-file.txt", fullPath=full_path, gpgSecretPassphrase="testing")
        else:
            assert (
                DecryptData(fileName="valid-file.txt", fullPath=full_path, gpgSecretPassphrase="testing").fullPath
                == full_path
            )
