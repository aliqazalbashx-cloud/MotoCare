import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('motorcare_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const currentToken = token || localStorage.getItem('motorcare_token');
      const headers = new Headers(options.headers || {});

      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // If token expired or invalid, log out
          setToken(null);
          setUser(null);
          localStorage.removeItem('motorcare_token');
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    },
    [token]
  );

  // Check auth session on load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('motorcare_token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem('motorcare_token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Session validation error:', err);
          localStorage.removeItem('motorcare_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log in');
    }

    localStorage.setItem('motorcare_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account');
    }

    localStorage.setItem('motorcare_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();

      // Verify token with backend and get/create user
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with Google');
      }

      localStorage.setItem('motorcare_token', idToken);
      setToken(idToken);
      setUser(data.user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw new Error(err.message || 'Google authentication failed');
    }
  };

  const loginAsDemo = async () => {
    const res = await fetch('/api/seed/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load demo account');
    }

    localStorage.setItem('motorcare_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } finally {
      localStorage.removeItem('motorcare_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfileName = async (name: string) => {
    const data = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    setUser(data.user);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => {
    await apiFetch('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginAsDemo,
        logout,
        updateProfileName,
        changePassword,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
