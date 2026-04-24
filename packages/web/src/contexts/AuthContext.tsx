import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, authApi } from '@/lib/api';
import { canDo, type AdminAction, type AdminRole } from '@/lib/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  adminRole?: AdminRole | null;
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
  logout: () => void;
  can: (action: AdminAction) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = localStorage.getItem('brandly_auth_token');
      if (token) {
        api.setToken(token);
        const response = await authApi.me() as { user: User } | User;
        const userData = 'user' in response ? response.user : response;
        setUser(userData as User);
      }
    } catch {
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const response = (await authApi.login({ email, password })) as { token: string; user: User };
    api.setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, referralCode?: string) => {
      const response = (await authApi.register({
        name,
        email,
        password,
        referralCode: referralCode || undefined,
      })) as { token: string; user: User };
      api.setToken(response.token);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  const can = useCallback(
    (action: AdminAction) => {
      if (!user || user.role !== 'admin') return false;
      return canDo(user.adminRole, action);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        can,
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
