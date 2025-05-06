from fastapi.testclient import TestClient
from factory import decryptor_for_testing
from main import app, create_pass_service_with
from repos.file_repository import FakeFileRepository
from services.pass_service import PassService
from config import settings


def test_wrong_login() -> None:
    client = TestClient(app)
    response = client.post("/token", data={"username": "aa", "password": "bb"})

    assert response.status_code == 401


def test_correct_login() -> None:
    client = TestClient(app)
    response = client.post("/token", data={"username": "admin", "password": "testing"})

    assert response.status_code == 200

    current = response.json()
    assert isinstance(current["access_token"], str)
    assert len(current["access_token"]) > 0
    assert current["token_type"] == "bearer"


def test_search_file(client: TestClient) -> None:
    def act():
        response = client.get("/search/file")

        assert response.status_code == 200
        assert response.json() == [
            {"fileName": "file1.ciao", "fullPath": "folder_a/file1.ciao"},
            {"fileName": "file2.bla", "fullPath": "folder_b/subfolder_c/file2.bla"},
            {"fileName": "file3.hola", "fullPath": "folder_i/file3.hola"},
        ]

    setup_test(act)


def test_search_file_without_login():
    client = TestClient(app)
    response = client.get("/search/file")

    assert response.status_code == 401


def test_decrypt_file(client: TestClient) -> None:
    def act():
        response = client.post(
            "/decrypt",
            json={
                "fileName": "expected.txt.gpg",
                "fullPath": str(settings.fixtures_path / "expected.txt.gpg"),
            },
        )

        assert response.status_code == 200
        assert response.json() == {"content": "green!"}

    setup_test(act)


def test_decrypt_without_login():
    client = TestClient(app)
    response = client.post(
        "/decrypt",
        json={
            "file_name": "expected.txt.gpg",
            "full_path": str(settings.fixtures_path / "expected.txt.gpg"),
        },
    )

    assert response.status_code == 401


def test_file_not_found(client: TestClient) -> None:
    def act():
        response = client.post(
            "/decrypt",
            json={
                "fileName": "not_found.txt.gpg",
                "fullPath": str(settings.fixtures_path / "not_found.txt.gpg"),
            },
        )

        assert response.status_code == 404

    setup_test(act)


def setup_test(act):
    app.dependency_overrides[create_pass_service_with] = lambda: PassService(
        FakeFileRepository(), decryptor_for_testing()
    )

    act()

    app.dependency_overrides.clear()
