// src/context/ThemeRepositoryProvider.tsx
import React, {
  ReactNode,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FileThemeRepository } from "../repository/themeRepository";
import {
  ThemeContextType,
  ThemeRepositoryContext,
} from "./ThemeRepositoryContext";

const repositoryInstance = new FileThemeRepository();

export const ThemeRepositoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentTheme, setCurrentTheme] = useState<string | null>(
    () => repositoryInstance.getTheme() // Obtiene el tema inicial del repo
  );

  useEffect(() => {
    const initialTheme = repositoryInstance.getTheme();
    console.log(
      "[ThemeRepoProvider] Initializing. Theme from repo:",
      initialTheme
    );
    if (initialTheme) {
      repositoryInstance
        .load()
        .then(() => {
          console.log(
            "[ThemeRepoProvider] Initial theme CSS loaded for:",
            initialTheme
          );
        })
        .catch((err) => {
          console.error(
            "[ThemeRepoProvider] Failed to load initial theme CSS:",
            err
          );
        });
    }
  }, []);

  const setAppTheme = useCallback(async (themeName: string) => {
    try {
      repositoryInstance.setTheme(themeName);
      await repositoryInstance.load();
      setCurrentTheme(repositoryInstance.getTheme());
    } catch (error) {
      console.error("[ThemeRepoProvider] Error in setAppTheme:", error);
    }
  }, []);

  const listAvailableThemes = useCallback(async (): Promise<string[]> => {
    try {
      const themes = await repositoryInstance.readAvailableThemes();

      return themes.map((file) => file.replace(/\.css$/, ""));
    } catch (error) {
      console.error("[ThemeRepoProvider] Error listing themes:", error);
      return [];
    }
  }, []);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      repository: repositoryInstance,
      currentTheme,
      setAppTheme,
      listAvailableThemes,
    }),
    [currentTheme, setAppTheme, listAvailableThemes]
  );

  return (
    <ThemeRepositoryContext.Provider value={contextValue}>
      {children}
    </ThemeRepositoryContext.Provider>
  );
};
