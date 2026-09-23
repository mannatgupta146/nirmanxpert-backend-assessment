import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuth } from './useAuth';

export const useRegister = () => {
  const { login: setAuthContext } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const register = async (data: any) => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Hit the backend Registration logic
      await authApi.register(data);
      
      // 2. Automatically log them in after registration
      const res = await authApi.login({ email: data.email, password: data.password });
      setAuthContext(res.accessToken, res.refreshToken, res.user);
      
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
