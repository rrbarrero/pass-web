import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { AuthContext, AuthContextType } from "./AuthContext";

const TOKEN_STORAGE_KEY = "authToken";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        setTokenState(storedToken);
      }
    } catch (error) {
      console.error("AuthProvider: Error reading localStorage", error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetToken = useCallback((newToken: string | null) => {
    try {
      setTokenState(newToken);
      if (newToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      console.error("AuthProvider: Error writing in localStorage", error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    console.log("AuthProvider: Ejecutando logout");
    handleSetToken(null);
  }, [handleSetToken]);

  const contextValue: AuthContextType = {
    token,
    login: handleSetToken,
    logout: handleLogout,
    isLoading,
  };

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
