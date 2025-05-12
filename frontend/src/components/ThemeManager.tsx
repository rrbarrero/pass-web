import { useEffect } from "react";
import useFileThemeRepository from "../hooks/useFileThemeRepository";
import React from "react";

const ThemeEffectManager: React.FC = () => {
  const { currentTheme, repository } = useFileThemeRepository();
  const [initialLoadDone, setInitialLoadDone] = React.useState(false);

  useEffect(() => {
    if (repository && !initialLoadDone) {
      repository
        .load()
        .then(() => {
          setInitialLoadDone(true);
          const themeToApply = repository.getTheme();
          if (themeToApply) {
            document.documentElement.classList.add(`theme-${themeToApply}`);
            document.documentElement.dataset.theme = themeToApply;
          }
        })
        .catch((err) => {
          console.error("ThemeEffectManager: Initial theme load failed", err);
        });
    }
  }, [repository, initialLoadDone]);

  useEffect(() => {
    if (!initialLoadDone) {
      return;
    }

    const previousThemeOnHtml = document.documentElement.dataset.theme;

    if (currentTheme && currentTheme !== previousThemeOnHtml) {
      if (previousThemeOnHtml) {
        document.documentElement.classList.remove(
          `theme-${previousThemeOnHtml}`
        );
      }
      document.documentElement.classList.add(`theme-${currentTheme}`);
      document.documentElement.dataset.theme = currentTheme;
    } else if (!currentTheme && previousThemeOnHtml) {
      document.documentElement.classList.remove(`theme-${previousThemeOnHtml}`);
      delete document.documentElement.dataset.theme;
    }
  }, [currentTheme, initialLoadDone]);

  return null;
};

export default ThemeEffectManager;
