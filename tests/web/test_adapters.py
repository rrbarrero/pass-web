from domain.pass_file import PassFile
from web.adapters import FilesUiAdapter


def test_file_ui_adapter():
    current = FilesUiAdapter([PassFile.from_path("/ciao/hola.txt")]).adapt()

    assert current == [{"fileName": "hola.txt", "fullPath": "/ciao/hola.txt"}]
