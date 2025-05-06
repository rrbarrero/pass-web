import { createContext } from "react";
import { FileRepositoryIface } from "../repository/file_repository"; // Adjust path if needed

export interface FileRepositoryContextType {
  repository: FileRepositoryIface | null;
}

export const FileRepositoryContext = createContext<FileRepositoryContextType>({
  repository: null,
});
