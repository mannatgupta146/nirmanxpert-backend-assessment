import React, { createContext, useState, useEffect } from 'react';

type UserRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      sessionStorage.removeItem('user');
    };

    window.addEventListener('auth_logout', handleLogout);
    
    const initializeAuth = async () => {
      try {
        const { api } = await import('../../../shared/api/axios');
        const res = await api.get('/auth/me');
        setUser(res.data);
        sessionStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        setUser(null);
        sessionStorage.removeItem('user');
      }
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      window.removeEventListener('auth_logout', handleLogout);
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const { api } = await import('../../../shared/api/axios');
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
