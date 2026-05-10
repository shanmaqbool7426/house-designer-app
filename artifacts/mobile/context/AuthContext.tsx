import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const DOMAIN = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
if (DOMAIN) {
  setBaseUrl(`https://${DOMAIN}`);
}

const TOKEN_KEY = "@ai_home_token";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  plan: "free" | "pro";
  aiCredits: number;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCredits: (credits: number) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeToken = useCallback(async (t: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setAuthTokenGetter(() => t);
  }, []);

  const clearToken = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAuthTokenGetter(() => null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          setAuthTokenGetter(() => stored);
          const res = await fetch(`https://${DOMAIN}/api/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (res.ok) {
            const u = (await res.json()) as AuthUser;
            setToken(stored);
            setUser(u);
            setAuthTokenGetter(() => stored);
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
      } finally {
        setIsLoading(false);
      }
    }
    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`https://${DOMAIN}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { token: string; user: AuthUser; message?: string };
    if (!res.ok) throw new Error(data.message ?? "Login failed");
    await storeToken(data.token);
    setUser(data.user);
  }, [storeToken]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`https://${DOMAIN}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json()) as { token: string; user: AuthUser; message?: string };
    if (!res.ok) throw new Error(data.message ?? "Registration failed");
    await storeToken(data.token);
    setUser(data.user);
  }, [storeToken]);

  const logout = useCallback(async () => {
    await clearToken();
  }, [clearToken]);

  const updateCredits = useCallback((credits: number) => {
    setUser((u) => u ? { ...u, aiCredits: credits } : u);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((u) => u ? { ...u, ...updates } : u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateCredits, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
