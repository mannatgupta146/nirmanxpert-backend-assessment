import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useLogout = () => {
  const { logout: clearAuth } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return { logout };
};
