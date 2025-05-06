from dataclasses import dataclass
from pathlib import Path


@dataclass
class PassFile:
    file_name: str
    full_path: Path

    @classmethod
    def from_path(cls, path: Path | str):
        if isinstance(path, str):
            path = Path(path)
        return cls(file_name=path.name, full_path=path)
