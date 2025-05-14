// src/hooks/useFileRepository.ts
import { useCallback, useContext, useState } from "react";
import { PassFile } from "../domain/passFile";
import { FileRepositoryContext } from "../context/FileRepositoryContext";
import { useAuth } from "./useAuth"; // <-- Import useAuth

const useFileRepository = () => {
  const [filesFound, setFilesFound] = useState<PassFile[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { repository } = useContext(FileRepositoryContext);
  const { token } = useAuth(); // <-- Get the token from auth context

  if (!repository) {
    throw new Error(
      "useFileRepository must be used within a FileRepositoryProvider"
    );
  }

  const searchFile = useCallback(
    async (fileName: string) => {
      if (!repository) {
        // ... (rest of check)
        return;
      }
      if (!token) {
        // <-- Check if token exists before calling API
        setError("Not authenticated. Please log in.");
        return;
      }
      setIsLoading(true);
      setError(null);
      setFilesFound([]);
      setFileContent(null);
      try {
        // Pass the token to the repository method
        const results = await repository.searchFile(fileName, token);
        setFilesFound(results);
      } catch (err) {
        console.error("useFileRepository: Error during searchFile", err);
        setError(
          err instanceof Error ? err.message : "An error occurred during search"
        );
        setFilesFound([]);
      } finally {
        setIsLoading(false);
      }
    },
    [repository, token] // <-- Add token to dependency array
  );

  const decryptFile = useCallback(
    async (passFile: PassFile, gpgPassword: string) => {
      // Renamed from fileName to filePath for clarity
      if (!repository) {
        // ... (rest of check)
        return;
      }
      if (!token) {
        // <-- Check if token exists before calling API
        setError("Not authenticated. Please log in.");
        return;
      }
      setIsLoading(true);
      setError(null);
      setFileContent(null);
      try {
        // Pass the token to the repository method
        const result = await repository.decryptFile(
          passFile,
          token,
          gpgPassword
        );
        setFileContent(result);
      } catch (err) {
        console.error("useFileRepository: Error during decryptFile", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during decrypt"
        );
        setFileContent(null);
      } finally {
        setIsLoading(false);
      }
    },
    [repository, token] // <-- Add token to dependency array
  );

  const clearFileContent = useCallback(() => {
    setFileContent(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    filesFound,
    searchFile,
    fileContent,
    decryptFile,
    clearFileContent,
    isLoading,
    error,
    clearError,
  };
};

export default useFileRepository;
