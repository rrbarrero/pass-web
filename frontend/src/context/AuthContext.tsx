import { createContext } from "react";

export interface AuthContextType {
  token: string | null;
  login: (newToken: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
