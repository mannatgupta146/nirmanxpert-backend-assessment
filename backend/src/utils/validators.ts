import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']).optional().default('MEMBER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createChannelSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters long'),
  isPublic: z.boolean().optional().default(true),
});

export const updateChannelSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters long').optional(),
  isPublic: z.boolean().optional(),
});

export const muteMemberSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
  isMuted: z.boolean(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']),
});

// Socket payload schemas
export const sendMessageSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message too long'),
});

export const deleteMessageSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  messageId: z.string().min(1, 'Message ID is required'),
});

export const editMessageSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  messageId: z.string().min(1, 'Message ID is required'),
  content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message too long'),
});
