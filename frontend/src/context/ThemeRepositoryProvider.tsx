import { ReactNode, useMemo } from "react";
import {
  FileThemeRepository,
  ThemeRepositoryIface,
} from "../repository/themeRepository";
import { ThemeRepositoryContext } from "./ThemeRepositoryContext";

export const ThemeRepositoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const repository = useMemo<ThemeRepositoryIface>(() => {
    return new FileThemeRepository();
  }, []);

  return (
    <ThemeRepositoryContext.Provider value={{ repository }}>
      {children}
    </ThemeRepositoryContext.Provider>
  );
};
