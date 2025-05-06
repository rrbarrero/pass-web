import gnupg
import os


class GPGDecryptionError(Exception):
    pass


class GPGFileNotFoundError(FileNotFoundError, GPGDecryptionError):
    pass


class GPGDecryptionFailedError(GPGDecryptionError):
    def __init__(self, message, status=None, stderr=None):
        super().__init__(message)
        self.status = status
        self.stderr = stderr

    def __str__(self):
        details = f"Status: {self.status}" if self.status else ""
        if self.stderr:
            details += f"\nGPG Stderr:\n{self.stderr}"
        return f"{super().__str__()} {details}".strip()


class GPGConfigurationError(GPGDecryptionError):
    pass


class GPGDecryptor:
    def __init__(self, gpg_instance: gnupg.GPG, passphrase: str):
        if not isinstance(gpg_instance, gnupg.GPG):
            raise TypeError("gpg_instance must be an initialized gnupg.GPG object")

        self.gpg = gpg_instance
        if not self.gpg.encoding:
            self.gpg.encoding = "utf-8"

        self.passphrase = passphrase

    def decrypt_file_to_string(
        self, encrypted_file_path: str, encoding: str = "utf-8"
    ) -> str:
        if not os.path.exists(encrypted_file_path):
            raise GPGFileNotFoundError(
                f"Encrypted file not found at: {encrypted_file_path}"
            )

        try:
            decrypted_data = self.gpg.decrypt_file(
                encrypted_file_path, passphrase=self.passphrase
            )

            if decrypted_data.ok:
                return decrypted_data.data.decode(encoding).rstrip()
            else:
                error_message = (
                    f"GPG decryption failed for file: {encrypted_file_path}."
                )
                raise GPGDecryptionFailedError(
                    error_message,
                    status=decrypted_data.status,
                    stderr=decrypted_data.stderr,
                )
        except FileNotFoundError as e:
            raise GPGFileNotFoundError(f"GPG reported file not found: {e}") from e
        except UnicodeDecodeError as e:
            raise UnicodeDecodeError(
                e.encoding,
                e.object,
                e.start,
                e.end,
                f"Failed to decode decrypted data as {encoding}: {e.reason}",
            ) from e
        except Exception as e:
            if isinstance(e, (KeyboardInterrupt, SystemExit)):
                raise
            raise GPGDecryptionError(
                f"An unexpected error occurred during GPG decryption: {e}"
            ) from e


def create_gpg_instance(gnupg_home: str | None = None) -> gnupg.GPG:
    try:
        gpg = gnupg.GPG(gnupghome=gnupg_home)
        gpg.encoding = "utf-8"

        # Test if GPG is actually working by listing keys (optional but good check)
        gpg.list_keys()

        return gpg
    except FileNotFoundError:
        raise GPGConfigurationError(
            "GnuPG binary ('gpg') not found. Is GnuPG installed and in the system PATH?"
        )
    except Exception as e:
        raise GPGConfigurationError(f"Failed to initialize GnuPG: {e}") from e
