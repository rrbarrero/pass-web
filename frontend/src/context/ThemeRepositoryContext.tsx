import { createContext } from "react";
import { ThemeRepositoryIface } from "../repository/themeRepository";

export interface ThemeContextType {
  repository: ThemeRepositoryIface;
  currentTheme: string | null;
  setAppTheme: (themeName: string) => Promise<void>;
  listAvailableThemes: () => Promise<string[]>;
}

export const ThemeRepositoryContext = createContext<
  ThemeContextType | undefined
>(undefined);
