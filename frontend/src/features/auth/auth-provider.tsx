"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ensureCsrfCookie,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "./api";
import type { AuthStatus, Credentials, RegisterInput, User } from "./types";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (credentials: Credentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [status, setStatus] = useState<AuthStatus>(
    initialUser ? "authenticated" : "anonymous",
  );

  useEffect(() => {
    // Deja lista la cookie CSRF para las peticiones de escritura.
    void ensureCsrfCookie();
  }, []);

  const refresh = useCallback(async () => {
    const current = await fetchCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "anonymous");
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    setUser(await loginRequest(credentials));
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setUser(await registerRequest(input));
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
