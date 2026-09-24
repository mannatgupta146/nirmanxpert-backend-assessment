import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuth } from './useAuth';

export const useLogin = () => {
  const { login: setAuthContext } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');

  const login = async (credentials: any, roleIdentifier: string = 'MANUAL') => {
    setLoadingRole(roleIdentifier);
    setError('');
    
    try {
      const res = await authApi.login(credentials);
      setAuthContext(res.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or connection failed.');
    } finally {
      setLoadingRole(null);
    }
  };

  return { login, loadingRole, error };
};
