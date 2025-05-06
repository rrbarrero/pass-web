from src.factory import create_gpg_decryptor


def test_decrypt_file():
    gpg_decryptor = create_gpg_decryptor()

    encrypted_file_path = "tests/__fixtures__/expected.txt.gpg"

    decrypted_content = gpg_decryptor.decrypt_file_to_string(
        encrypted_file_path, encoding="utf-8"
    )

    assert decrypted_content == "green!"
