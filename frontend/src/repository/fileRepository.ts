import { PassFile } from "../domain/passFile";

export interface FileRepositoryIface {
  searchFile(fileName: string, token: string | null): Promise<PassFile[]>;
  decryptFile(
    passFile: PassFile,
    token: string | null,
    gpgPassword: string | null
  ): Promise<string>;
}

export interface SpyParameters {
  fileName: string;
  fullPath: string;
  gpgPassword: string | null;
}

export class FakeFileRepository implements FileRepositoryIface {
  files: PassFile[] = [
    { fileName: "file.ext.gpg", fullPath: "/bla/ciao/hola/file.ext.gpg" },
    { fileName: "other.bat.gpg", fullPath: "/bla/hola/ciao/other.bat.gpg" },
  ];
  parameters: SpyParameters | null = null;

  constructor(paths?: PassFile[]) {
    if (paths !== undefined) {
      this.files = paths;
    }
    this.parameters = null;
  }

  async searchFile(
    fileName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: string | null
  ): Promise<PassFile[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const results = this.files.filter((x) => x.fileName.includes(fileName));
    console.log(`FakeFileRepository: Found ${results.length} files.`);
    return results;
  }

  async decryptFile(
    passFile: PassFile,
    _token: string | null,
    gpgPassword: string | null
  ): Promise<string> {
    this.parameters = { ...passFile, gpgPassword };
    await new Promise((resolve) => setTimeout(resolve, 500));
    const fileExists = this.files.some((f) => f === passFile);
    if (!fileExists) {
      console.log(`FakeFileRepository: File "${passFile}" not found.`);
      throw new Error("File not found");
    }
    return "green!";
  }
}
