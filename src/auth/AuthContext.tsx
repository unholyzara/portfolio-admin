import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest } from '../api/auth';
import { ApiError, onUnauthorized, request } from '../api/client';
import { ENDPOINTS } from '../resources/endpoints';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unreachable';

interface AuthValue {
  status: AuthStatus;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => void;
}

const EMAIL_KEY = 'admin.email';

const readStoredEmail = (): string | null => {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
};

const storeEmail = (email: string | null) => {
  try {
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
    else window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    return;
  }
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [email, setEmail] = useState<string | null>(readStoredEmail);

  const probe = useCallback(async () => {
    setStatus('checking');
    try {
      await request(ENDPOINTS.siteSettings, { skipUnauthorizedEvent: true });
      setStatus('authenticated');
    } catch (error) {
      const denied = error instanceof ApiError && (error.status === 401 || error.status === 403);
      setStatus(denied ? 'anonymous' : 'unreachable');
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  useEffect(
    () =>
      onUnauthorized(() => {
        queryClient.clear();
        setStatus('anonymous');
      }),
    [queryClient],
  );

  const login = useCallback(
    async (nextEmail: string, password: string) => {
      await loginRequest(nextEmail, password);
      queryClient.clear();
      storeEmail(nextEmail);
      setEmail(nextEmail);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      storeEmail(null);
      setEmail(null);
      queryClient.clear();
      setStatus('anonymous');
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, email, login, logout, recheck: () => void probe() }),
    [status, email, login, logout, probe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
