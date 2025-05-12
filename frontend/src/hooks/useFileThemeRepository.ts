import { useContext } from "react";
import {
  ThemeRepositoryContext,
  ThemeContextType,
} from "../context/ThemeRepositoryContext";

const useFileThemeRepository = (): ThemeContextType => {
  const context = useContext(ThemeRepositoryContext);

  if (context === undefined) {
    throw new Error(
      "useFileThemeRepository must be used within a ThemeRepositoryProvider"
    );
  }

  return context;
};

export default useFileThemeRepository;
