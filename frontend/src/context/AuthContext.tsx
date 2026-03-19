import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { AUTH_TOKEN_KEY, ApiError, apiFetch } from "../lib/api";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(token);
        setUser(currentUser);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [token]);

  async function login(credentials: AuthCredentials) {
    const response = await apiFetch<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    window.localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    try {
      const currentUser = await fetchCurrentUser(response.access_token);
      setUser(currentUser);
    } catch (error) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }

  async function signup(credentials: AuthCredentials) {
    const response = await apiFetch<AuthTokenResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    window.localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    try {
      const currentUser = await fetchCurrentUser(response.access_token);
      setUser(currentUser);
    } catch (error) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }

  function logout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  try {
    return await apiFetch<AuthUser>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new Error("Unable to restore auth session");
  }
}
