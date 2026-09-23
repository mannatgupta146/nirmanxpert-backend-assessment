import React, { createContext, useState, useEffect } from 'react';

type UserRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('accessToken');
  });

  useEffect(() => {

    // Listen for events from Axios interceptors
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };
    const handleTokenRefresh = (e: any) => {
      setToken(e.detail);
    };

    window.addEventListener('auth_logout', handleLogout);
    window.addEventListener('token_refreshed', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('auth_logout', handleLogout);
      window.removeEventListener('token_refreshed', handleTokenRefresh);
    };
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
