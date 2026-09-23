import { api } from '../../../shared/api/axios';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

export const adminApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  
  updateRole: async (userId: string, role: string) => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  toggleMute: async (channelId: string, userId: string, isMuted: boolean) => {
    const response = await api.post(`/channels/${channelId}/mute`, { userId, isMuted });
    return response.data;
  },

  getChannelMembers: async (channelId: string) => {
    const response = await api.get(`/channels/${channelId}/members`);
    return response.data;
  },

  addMember: async (channelId: string, userId: string) => {
    const response = await api.post(`/channels/${channelId}/members`, { userId });
    return response.data;
  }
};
