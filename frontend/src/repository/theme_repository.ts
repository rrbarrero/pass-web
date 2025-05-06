const loadTheme = async () => {
  const themeName = import.meta.env.VITE_APP_THEME || "default";
  console.log(`Loading theme: ${themeName}`); // For debugging

  try {
    // Use dynamic import based on the theme name
    // Vite will handle creating separate CSS chunks during build
    await import(`../themes/${themeName}.css`);
  } catch (error) {
    console.error(`Failed to load theme ${themeName}.css:`, error);
    if (themeName !== "default") {
      try {
        await import("../themes/default.css");
        console.log(`Fallback theme default.css loaded.`);
      } catch (fallbackError) {
        console.error(
          `Failed to load fallback theme default.css:`,
          fallbackError
        );
      }
    }
  }
};

loadTheme();

export const themeLoader = true;
