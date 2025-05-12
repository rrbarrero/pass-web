import React, { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import Home from "./components/Home";
import { FileRepositoryProvider } from "./context/FileRepositoryProvider";
import { ThemeRepositoryProvider } from "./context/ThemeRepositoryProvider";
import "./assets/css/theme-variables.css";
import "./App.css";
import ThemeEffectManager from "./components/ThemeManager";

const getThemeClassName = (themeName: string | undefined): string => {
  const defaultThemeClass = "default";
  if (!themeName) {
    console.warn(
      "VITE_APP_THEME environment variable not set. Using default theme class."
    );
    return defaultThemeClass;
  }

  return themeName.toLowerCase();
};

const AppContent: React.FC = () => {
  const { token } = useAuth();
  const [themeClass, setThemeClass] = useState<string>("");

  useEffect(() => {
    const envTheme = import.meta.env.VITE_APP_THEME;
    const calculatedThemeClass = getThemeClassName(envTheme);
    setThemeClass(calculatedThemeClass);
  }, []);

  if (!themeClass) {
    return null; // TODO: spiner here
  }

  return (
    <div>
      {!token ? (
        <>
          <h1>Login</h1>
          <Login />
        </>
      ) : (
        <FileRepositoryProvider>
          <Home />
        </FileRepositoryProvider>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeRepositoryProvider>
      <ThemeEffectManager />
      <AuthProvider>
        <AppContent />{" "}
      </AuthProvider>
    </ThemeRepositoryProvider>
  );
};

export default App;
