import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, authApi } from '@/lib/api';
import { getItem, setItem, deleteItem } from '@/lib/storage';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  referralCode?: string;
  onboardingCompleted?: boolean;
  [key: string]: unknown;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const TOKEN_KEY = 'brandly_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await getItem(TOKEN_KEY);
      if (token) {
        api.setToken(token);
        const userData = await authApi.me();
        setUser(userData as User);
      }
    } catch {
      await deleteItem(TOKEN_KEY);
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password }) as { token: string; user: User };
    api.setToken(response.token);
    await setItem(TOKEN_KEY, response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, referralCode?: string) => {
      const response = await authApi.register({
        name,
        email,
        password,
        referralCode: referralCode || undefined,
      }) as { token: string; user: User };
      api.setToken(response.token);
      await setItem(TOKEN_KEY, response.token);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await deleteItem(TOKEN_KEY);
    api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
