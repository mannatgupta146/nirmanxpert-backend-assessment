import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth.socket';
import { redisClient } from '../config/redis';
import { sendMessageSchema, deleteMessageSchema, editMessageSchema } from '../utils/validators';
import prisma from '../config/db';

// In-memory presence tracker (for demo purposes)
const onlineUsers = new Map<string, number>(); // userId -> count of active sockets

export const setupChatSockets = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;
    if (!userId) return socket.disconnect();

    console.log(`User connected to socket: ${userId} (${socket.id})`);
    
    // Mark as online and track connection count
    const currentCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, currentCount + 1);
    
    // Only emit if this is their first connection
    if (currentCount === 0) {
      io.emit('presence_update', { userId, status: 'online' });
    }

    // Give the new socket the current online users list
    socket.emit('initial_presence', Array.from(onlineUsers.keys()));

    // Join a specific channel room
    socket.on('join_channel', async (channelId: string) => {
      // Basic check if user is a member of the channel
      const isMember = await prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId },
        },
      });

      if (!isMember) {
        return socket.emit('error', { message: 'You must join the channel first' });
      }

      socket.join(channelId);
      console.log(`User ${userId} joined room ${channelId}`);
    });

    // Leave a specific channel room
    socket.on('leave_channel', (channelId: string) => {
      socket.leave(channelId);
      console.log(`User ${userId} left room ${channelId}`);
    });

    // Send a message
    socket.on('send_message', async (rawPayload: any) => {
      try {
        const parseResult = sendMessageSchema.safeParse(rawPayload);
        if (!parseResult.success) {
          return socket.emit('error', { message: 'Invalid payload format' });
        }
        
        const data = parseResult.data;

        // --- Rate Limiting Logic ---
        const rateLimitKey = `rate_limit:${userId}`;
        const currentCount = await redisClient.incr(rateLimitKey);
        
        if (currentCount === 1) {
          // Set expiry to 3 seconds on the first message
          await redisClient.expire(rateLimitKey, 3);
        }
        
        if (currentCount > 5) {
          return socket.emit('rate_limit_error', { message: 'You are sending messages too fast (max 5 per 3s)' });
        }
        // ---------------------------

        // Verify the user is a member and NOT muted
        const membership = await prisma.channelMember.findUnique({
          where: { userId_channelId: { userId, channelId: data.channelId } }
        });

        if (!membership) {
          return socket.emit('error', { message: 'You must join the channel to send messages' });
        }

        if (membership.isMuted) {
          return socket.emit('error', { message: 'You are muted in this channel' });
        }

        // Persist message to database
        const message = await prisma.message.create({
          data: {
            content: data.content,
            channelId: data.channelId,
            senderId: userId,
          },
          include: {
            sender: {
              select: { id: true, email: true, role: true }
            }
          }
        });

        // Broadcast to everyone in the room (including sender)
        io.to(data.channelId).emit('new_message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on('typing', async (channelId: string) => {
      const membership = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
        include: { user: true }
      });
      if (membership) {
        socket.to(channelId).emit('user_typing', { userId, channelId, email: membership.user.email });
      }
    });

    socket.on('stop_typing', async (channelId: string) => {
      const membership = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } }
      });
      if (membership) {
        socket.to(channelId).emit('user_stopped_typing', { userId, channelId });
      }
    });

    // Moderation (Delete Message)
    socket.on('delete_message', async (rawPayload: any) => {
      const parseResult = deleteMessageSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        return socket.emit('error', { message: 'Invalid payload format' });
      }
      const data = parseResult.data;

      if (socket.user?.role !== 'ADMIN' && socket.user?.role !== 'MODERATOR') {
        return socket.emit('error', { message: 'Unauthorized action' });
      }

      try {
        // Fetch the message first to check who sent it
        const messageToModerate = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: { sender: true }
        });

        if (!messageToModerate) {
          return socket.emit('error', { message: 'Message not found' });
        }

        // Hierarchy check: Moderators cannot delete Admin messages
        if (socket.user?.role === 'MODERATOR' && messageToModerate.sender.role === 'ADMIN') {
          return socket.emit('error', { message: 'Moderators cannot delete Admin messages' });
        }

        const roleStr = socket.user?.role === 'ADMIN' ? 'an admin' : 'a moderator';
        
        await prisma.message.update({
          where: { id: data.messageId },
          data: { isDeleted: true, content: `This message was deleted by ${roleStr}.` },
        });

        io.to(data.channelId).emit('message_deleted', { messageId: data.messageId, channelId: data.channelId, content: `This message was deleted by ${roleStr}.` });
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    // Edit Message
    socket.on('edit_message', async (rawPayload: any) => {
      const parseResult = editMessageSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        return socket.emit('error', { message: 'Invalid payload format' });
      }
      const data = parseResult.data;

      try {
        const messageToEdit = await prisma.message.findUnique({
          where: { id: data.messageId }
        });

        if (!messageToEdit) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (messageToEdit.senderId !== userId) {
          return socket.emit('error', { message: 'You can only edit your own messages' });
        }

        if (messageToEdit.isDeleted) {
          return socket.emit('error', { message: 'Cannot edit a deleted message' });
        }

        const now = new Date();
        const diffMs = now.getTime() - messageToEdit.createdAt.getTime();
        if (diffMs > 2 * 60 * 1000) {
          return socket.emit('error', { message: 'Messages can only be edited within 2 minutes of sending' });
        }

        await prisma.message.update({
          where: { id: data.messageId },
          data: { content: data.content, isEdited: true } as any,
        });

        io.to(data.channelId).emit('message_edited', { messageId: data.messageId, channelId: data.channelId, content: data.content });
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);
      
      const count = onlineUsers.get(userId) || 0;
      if (count <= 1) {
        onlineUsers.delete(userId);
        io.emit('presence_update', { userId, status: 'offline' });
      } else {
        onlineUsers.set(userId, count - 1);
      }
    });
  });
};
