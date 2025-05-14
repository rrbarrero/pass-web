import os
import re
from pydantic import BaseModel, field_validator
from config import settings


class DecryptData(BaseModel):
    fileName: str
    fullPath: str
    gpgPassword: str

    @field_validator("fileName")
    def validate_file_name(cls, v):
        if not re.match(r"^[-\w\s.@]+(\.[A-Za-z]{1,4})(\.gpg)?$", v):
            raise ValueError("Invalid characters in file name")
        return v

    @field_validator("fullPath")
    def validate_full_path(cls, v):
        if not os.path.normpath(v).startswith(str(settings.password_store_path)):
            raise ValueError("Path traversal attempt detected")
        return v
