import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: ('ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from client local storage safely
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('eh_access_token');
        const storedUser = localStorage.getItem('eh_user');
        
        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to parse cached authentication session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login attempt failed.');
      }

      const data = await response.json();
      
      setAccessToken(data.accessToken);
      setUser(data.user);

      localStorage.setItem('eh_access_token', data.accessToken);
      localStorage.setItem('eh_refresh_token', data.refreshToken);
      localStorage.setItem('eh_user', JSON.stringify(data.user));
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem('eh_refresh_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.warn('Backend logout trace error (session was cleared locally anyway):', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('eh_access_token');
      localStorage.removeItem('eh_refresh_token');
      localStorage.removeItem('eh_user');
      setIsLoading(false);
    }
  };

  const hasRole = (roles: ('ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT')[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider component hierarchy.');
  }
  return context;
};
