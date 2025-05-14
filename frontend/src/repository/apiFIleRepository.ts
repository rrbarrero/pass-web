import { PassFile } from "../domain/passFile";
import { FileRepositoryIface } from "./fileRepository";

async function handleApiError(response: Response): Promise<Error> {
  let errorDetail = response.statusText;
  try {
    const errorData = await response.json();
    if (errorData && errorData.detail) {
      errorDetail = errorData.detail;
    }
  } catch (e) {
    console.log(e);
  }

  let errorMessage = `API Error ${response.status}: ${errorDetail}`;
  if (response.status === 401) {
    errorMessage = "Unauthorized: Invalid or missing token.";
  } else if (
    response.status === 404 &&
    errorDetail.includes("File not found")
  ) {
    errorMessage = "Error: File not found on the server."; // Specific message
  } else if (
    response.status === 404 &&
    errorDetail.includes("Error decrypting file")
  ) {
    errorMessage = "Error decrypting file. Is the passphrase correct?"; // Specific message
  }

  return new Error(errorMessage);
}

export class ApiFileRepository implements FileRepositoryIface {
  private apiUrl: string;

  constructor(apiUrl: string) {
    if (!apiUrl) {
      throw new Error("API URL is required for ApiFileRepository");
    }
    this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash if present
    console.log(`ApiFileRepository initialized with URL: ${this.apiUrl}`);
  }

  async searchFile(
    fileName: string,
    token: string | null
  ): Promise<PassFile[]> {
    if (!token) {
      throw new Error("Authentication token is required for searching files.");
    }
    if (!fileName || fileName.trim() === "") {
      return [];
    }

    const url = `${this.apiUrl}/search/${encodeURIComponent(fileName)}`;
    console.log(`ApiFileRepository: Calling GET ${url}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      interface SearchResponse {
        fileName: string;
        fullPath: string;
      }
      const data: SearchResponse[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "API Error: Invalid response format received from search endpoint."
        );
      }

      const passFiles: PassFile[] = data
        .map((item) => ({
          fileName: item.fileName || "", // Provide default if missing
          fullPath: item.fullPath || "", // Provide default if missing
        }))
        .filter((pf) => pf.fileName && pf.fullPath); // Filter out invalid entries

      console.log(
        `ApiFileRepository: Search successful, received ${passFiles.length} results.`
      );
      return passFiles;
    } catch (err) {
      console.error(
        `ApiFileRepository: Error during searchFile for "${fileName}"`,
        err
      );
      throw err instanceof Error
        ? err
        : new Error("An unexpected network error occurred during search.");
    }
  }

  async decryptFile(
    passFile: PassFile,
    token: string | null,
    gpgPassword: string | null
  ): Promise<string> {
    if (!token) {
      throw new Error("Authentication token is required for decrypting files.");
    }
    if (!passFile) {
      throw new Error("File path is required for decryption.");
    }
    if (!gpgPassword) {
      throw new Error("GPG password is required for decryption.");
    }

    const url = `${this.apiUrl}/decrypt`;
    console.log(
      `ApiFileRepository: Calling POST ${url} for path: ${passFile.fullPath}`
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...passFile, gpgPassword }),
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const data = await response.json();

      if (typeof data?.content !== "string") {
        throw new Error(
          "API Error: Invalid response format received from decrypt endpoint."
        );
      }

      return data.content;
    } catch (err) {
      console.error(
        `ApiFileRepository: Error during decryptFile for "${passFile}"`,
        err
      );
      throw err instanceof Error
        ? err
        : new Error("An unexpected network error occurred during decryption.");
    }
  }
}
