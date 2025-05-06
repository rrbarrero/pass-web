from domain.pass_file import PassFile


class FilesUiAdapter:
    def __init__(self, files: list[PassFile]):
        self.files = files

    def adapt(self):
        return [
            {"fileName": x.file_name, "fullPath": str(x.full_path)} for x in self.files
        ]
