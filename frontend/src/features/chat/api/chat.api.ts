import { api } from '../../../shared/api/axios';

export const chatApi = {
  getChannels: async () => {
    const res = await api.get('/channels');
    return res.data;
  },
  getMyChannels: async () => {
    const res = await api.get('/channels/me');
    return res.data as string[];
  },
  getMessages: async (channelId: string) => {
    const res = await api.get(`/channels/${channelId}/messages`);
    return res.data;
  },
  createChannel: async (name: string, isPublic: boolean = true) => {
    const res = await api.post('/channels', { name, isPublic });
    return res.data;
  },
  deleteChannel: async (channelId: string) => {
    const res = await api.delete(`/channels/${channelId}`);
    return res.data;
  },
  joinChannel: async (channelId: string) => {
    const res = await api.post(`/channels/${channelId}/join`);
    return res.data;
  },
  leaveChannel: async (channelId: string, successorId?: string) => {
    const res = await api.post(`/channels/${channelId}/leave`, { successorId });
    return res.data;
  },
  updateChannel: async (channelId: string, data: { name?: string, isPublic?: boolean }) => {
    const res = await api.put(`/channels/${channelId}`, data);
    return res.data;
  }
};
