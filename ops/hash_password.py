#!/usr/bin/env python3

import sys
from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

if len(sys.argv) > 1:
    password_to_hash = sys.argv[1]
else:
    password_to_hash = getpass.getpass(
        "Enter the password to hash for ADMIN_PASSWORD: "
    )
    password_confirm = getpass.getpass("Confirm the password: ")
    if password_to_hash != password_confirm:
        print("Error: Passwords do not match.", file=sys.stderr)
        sys.exit(1)

hashed_password = pwd_context.hash(password_to_hash)
print(hashed_password)
