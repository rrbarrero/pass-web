export interface ThemeRepositoryIface {
  load(): Promise<void>;
  setTheme(theme: string): void;
  getTheme(): string | null;
  readAvailableThemes(): Promise<string[]>;
}

export class FileThemeRepository implements ThemeRepositoryIface {
  currentTheme: string | null = null;

  constructor() {
    this.currentTheme = import.meta.env.VITE_APP_THEME || "default";
  }

  setTheme(theme: string): void {
    this.currentTheme = theme;
  }

  getTheme(): string | null {
    return this.currentTheme;
  }

  async readAvailableThemes(): Promise<string[]> {
    try {
      const themes = await import.meta.glob("../themes/*.css", {
        eager: true,
      });
      return Object.keys(themes).map((theme) => theme.split("/").pop() || "");
    } catch (error) {
      console.error("Error loading themes:", error);
      return [];
    }
  }

  async load(): Promise<void> {
    try {
      await import(`../themes/${this.currentTheme}.css`);
    } catch (error) {
      console.error(`Failed to load theme ${this.currentTheme}.css:`, error);
      if (this.currentTheme !== "default") {
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
  }
}

new FileThemeRepository().load();

export const themeLoader = true;
