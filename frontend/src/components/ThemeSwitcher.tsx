import React, { useState, useEffect } from "react";
import useFileThemeRepository from "../hooks/useFileThemeRepository";

interface ThemeOption {
  value: string;
  label: string;
}

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, listAvailableThemes } =
    useFileThemeRepository();
  const [availableThemes, setAvailableThemes] = useState<ThemeOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThemes = async () => {
      try {
        setIsLoading(true);
        const themeNames = await listAvailableThemes();
        if (isMounted) {
          setAvailableThemes(
            themeNames.map((name) => ({
              value: name,
              label: name.charAt(0).toUpperCase() + name.slice(1),
            }))
          );
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch themes:", err);
        if (isMounted) {
          setError("Could not load themes.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchThemes();

    return () => {
      isMounted = false;
    };
  }, [listAvailableThemes]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
  };

  if (isLoading) {
    return <div>Loading themes...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div>
      <label htmlFor="theme-select">Select Theme: </label>
      <select
        id="theme-select"
        value={currentTheme || ""}
        onChange={handleThemeChange}
        disabled={availableThemes.length === 0}
      >
        {currentTheme === null && (
          <option value="" disabled>
            Select a theme
          </option>
        )}
        {availableThemes.map((themeOption) => (
          <option key={themeOption.value} value={themeOption.value}>
            {themeOption.label}
          </option>
        ))}
      </select>
      {currentTheme && (
        <p>
          Current theme: <strong>{currentTheme}</strong>
        </p>
      )}
    </div>
  );
};

export default ThemeSwitcher;
