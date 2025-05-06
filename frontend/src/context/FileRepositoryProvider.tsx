// src/context/FileRepositoryProvider.tsx (Example structure)
import React, { ReactNode, useMemo } from "react";
import { FileRepositoryContext } from "./FileRepositoryContext";
import {
  FakeFileRepository,
  FileRepositoryIface,
} from "../repository/file_repository";
import { ApiFileRepository } from "../repository/apiFIleRepository";

export const FileRepositoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use useMemo to create the repository instance only once
  const repository = useMemo<FileRepositoryIface>(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const useFakeRepo = import.meta.env.VITE_USE_FAKE_REPO === "true"; // Optional: flag to switch repos

    if (useFakeRepo) {
      console.log("Using FakeFileRepository");
      return new FakeFileRepository();
    } else {
      if (!apiUrl) {
        console.error("VITE_API_URL is not set. Cannot use ApiFileRepository.");
        // Fallback or throw error - here we fallback to fake to prevent crash
        alert("API URL not configured. Using fake data."); // Inform user
        return new FakeFileRepository();
        // OR: throw new Error("VITE_API_URL environment variable is not set.");
      }
      console.log("Using ApiFileRepository");
      return new ApiFileRepository(apiUrl);
    }
  }, []); // Empty dependency array ensures it runs only on mount

  return (
    <FileRepositoryContext.Provider value={{ repository }}>
      {children}
    </FileRepositoryContext.Provider>
  );
};
