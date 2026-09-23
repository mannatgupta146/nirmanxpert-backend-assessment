import { useState, useCallback } from 'react';
import { adminApi, type User } from '../api/admin.api';

export const useAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeRole = useCallback(async (userId: string, role: string) => {
    try {
      await adminApi.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as User['role'] } : u));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change role');
    }
  }, []);

  const toggleMute = useCallback(async (channelId: string, userId: string, isMuted: boolean) => {
    try {
      await adminApi.toggleMute(channelId, userId, isMuted);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle mute');
      throw err;
    }
  }, []);

  const fetchChannelMembers = useCallback(async (channelId: string) => {
    try {
      const data = await adminApi.getChannelMembers(channelId);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch members');
      return [];
    }
  }, []);

  const addMember = useCallback(async (channelId: string, userId: string) => {
    try {
      await adminApi.addMember(channelId, userId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member');
      throw err;
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    changeRole,
    toggleMute,
    fetchChannelMembers,
    addMember
  };
};
