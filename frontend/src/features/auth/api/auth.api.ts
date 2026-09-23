import { api } from '../../../shared/api/axios';

export const authApi = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (credentials: any) => {
    const res = await api.post('/auth/register', credentials);
    return res.data;
  },
};
