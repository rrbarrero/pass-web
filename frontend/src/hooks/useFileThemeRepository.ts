import { useCallback, useContext, useState } from "react";
import { ThemeRepositoryContext } from "../context/ThemeRepositoryContext";

const useFileThemeRepository = () => {
  const { repository } = useContext(ThemeRepositoryContext);

  if (!repository) {
    throw new Error(
      "useFileThemeRepository must be used within a ThemeRepositoryProvider"
    );
  }

  const [currentTheme, setCurrentTheme] = useState<string | null>(() =>
    repository.getTheme()
  );

  const setTheme = useCallback(
    async (theme: string) => {
      try {
        repository.setTheme(theme);
        await repository.load();
        setCurrentTheme(repository.getTheme());
      } catch (error) {
        console.error("Error setting theme:", error);
      }
    },
    [repository]
  );

  const listAvailableThemes = useCallback(async (): Promise<string[]> => {
    try {
      const themes = await repository.readAvailableThemes();
      return themes.map((file) => file.replace(/\.css$/, ""));
    } catch (error) {
      console.error("Error listing themes:", error);
      return [];
    }
  }, [repository]);

  return { currentTheme, setTheme, listAvailableThemes };
};

export default useFileThemeRepository;
