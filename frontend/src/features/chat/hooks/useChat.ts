import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../api/chat.api';
import { initSocket, disconnectSocket } from '../socket/socket';
import { useAuth } from '../../auth/hooks/useAuth';

export const useChat = () => {
  const { user } = useAuth();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [joinedChannelIds, setJoinedChannelIds] = useState<Set<string>>(new Set());
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsersMap, setTypingUsersMap] = useState<Map<string, string>>(new Map());
  
  const [input, setInput] = useState('');
  
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeChannelRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    
    fetchChannels();

    const socket = initSocket();
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setIsConnected(true);
      if (activeChannelRef.current) {
        socket.emit('join_channel', activeChannelRef.current);
      }
    });
    
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('new_message', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    
    socket.on('message_deleted', ({ messageId, content }: any) => {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isDeleted: true, content: content || 'This message was deleted.' } : m
      ));
    });

    socket.on('initial_presence', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('presence_update', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('user_typing', ({ userId, channelId, email }: any) => {
      if (channelId === activeChannelRef.current && email) {
        setTypingUsersMap(prev => {
          const next = new Map(prev);
          next.set(userId, email.split('@')[0]);
          return next;
        });
      }
    });

    socket.on('user_stopped_typing', ({ userId, channelId }: any) => {
      if (channelId === activeChannelRef.current) {
        setTypingUsersMap(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }
    });

    socket.on('message_edited', ({ messageId, content }: any) => {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isEdited: true, content: content } : m
      ));
    });

    socket.on('error', (data: any) => {
      setRateLimitError(data.message || 'Socket error occurred');
      setTimeout(() => setRateLimitError(null), 3000);
    });
    
    socket.on('rate_limit_error', (data: any) => {
      setRateLimitError(data.message);
      setTimeout(() => setRateLimitError(null), 3000);
    });

    return () => disconnectSocket();
  }, [user]);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
    if (!socketRef.current || !activeChannel) return;
    
    chatApi.getMessages(activeChannel)
      .then(data => {
        setMessages(data.reverse());
        setIsMember(true);
        setTypingUsersMap(new Map());
        socketRef.current.emit('join_channel', activeChannel);
      })
      .catch(err => {
        if (err.response?.status === 403 || err.response?.status === 404) {
          setIsMember(false);
          setMessages([]);
          setTypingUsersMap(new Map());
        }
      });
    
    return () => {
      socketRef.current?.emit('leave_channel', activeChannel);
    };
  }, [activeChannel]);

  const sendMessage = (content: string) => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('send_message', { channelId: activeChannel, content });
      socketRef.current.emit('stop_typing', activeChannel);
    }
  };

  const deleteMessage = (messageId: string) => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('delete_message', { channelId: activeChannel, messageId });
    }
  };

  const editMessage = (messageId: string, content: string) => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('edit_message', { channelId: activeChannel, messageId, content });
    }
  };

  const sendTyping = () => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('typing', activeChannel);
    }
  };

  const stopTyping = () => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('stop_typing', activeChannel);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping();
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const fetchChannels = () => {
    Promise.all([chatApi.getChannels(), chatApi.getMyChannels()]).then(([allChannels, myIds]) => {
      setChannels(allChannels);
      setJoinedChannelIds(new Set(myIds));
      if (allChannels.length > 0 && !activeChannel) setActiveChannel(allChannels[0].id);
    });
  };

  const handleCreateChannel = async (name: string, isPublic: boolean = true) => {
    try {
      const newChannel = await chatApi.createChannel(name, isPublic);
      setChannels(prev => [newChannel, ...prev]);
      setJoinedChannelIds(prev => new Set([...prev, newChannel.id]));
      setActiveChannel(newChannel.id);
    } catch (err: any) {
      console.error('Failed to create channel:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Failed to create channel';
      alert(errorMsg);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await chatApi.deleteChannel(channelId);
      setChannels(prev => prev.filter(c => c.id !== channelId));
      if (activeChannel === channelId) {
        setActiveChannel(channels.find(c => c.id !== channelId)?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete channel:', err);
      alert('Failed to delete channel');
    }
  };

  const handleRenameChannel = async (channelId: string, newName: string) => {
    try {
      const updated = await chatApi.updateChannel(channelId, { name: newName });
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, name: updated.name } : c));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Failed to rename channel';
      alert(msg);
    }
  };

  const handleUpdatePrivacy = async (channelId: string, isPublic: boolean) => {
    try {
      const updated = await chatApi.updateChannel(channelId, { isPublic });
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isPublic: updated.isPublic } : c));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Failed to update channel privacy';
      alert(msg);
    }
  };

  const handleJoinChannel = async () => {
    if (!activeChannel) return;
    try {
      await chatApi.joinChannel(activeChannel);
      setIsMember(true);
      setJoinedChannelIds(prev => new Set([...prev, activeChannel]));
      const data = await chatApi.getMessages(activeChannel);
      setMessages(data.reverse());
      socketRef.current?.emit('join_channel', activeChannel);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join channel');
    }
  };

  const handleLeaveChannel = async (successorId?: string) => {
    if (!activeChannel) return;
    try {
      await chatApi.leaveChannel(activeChannel, successorId);
      setIsMember(false);
      setJoinedChannelIds(prev => { const n = new Set(prev); n.delete(activeChannel); return n; });
      setMessages([]);
      socketRef.current?.emit('leave_channel', activeChannel);
      return true;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to leave channel');
      return false;
    }
  };

  return {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    isConnected,
    isMember,
    joinedChannelIds,
    rateLimitError,
    deleteMessage,
    input,
    handleTyping,
    handleSend,
    messagesEndRef,
    handleCreateChannel,
    handleDeleteChannel,
    handleRenameChannel,
    handleUpdatePrivacy,
    handleJoinChannel,
    handleLeaveChannel,
    editMessage,
    onlineUsers,
    typingUsers: typingUsersMap
  };
};
