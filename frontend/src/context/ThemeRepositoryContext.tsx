import { createContext } from "react";
import { ThemeRepositoryIface } from "../repository/themeRepository";

export interface ThemeRepositoryContextType {
  repository: ThemeRepositoryIface | null;
}

export const ThemeRepositoryContext = createContext<ThemeRepositoryContextType>(
  {
    repository: null,
  }
);
