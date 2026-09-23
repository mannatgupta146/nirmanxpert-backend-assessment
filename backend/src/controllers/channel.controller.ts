import { Request, Response } from 'express';
import prisma from '../config/db';

export const toggleMute = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.params.userId as string;
    
    // Check if the user is actually a member of this channel
    const membership = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } }
    });

    if (!membership) {
      return res.status(404).json({ error: 'User is not a member of this channel' });
    }

    // Toggle mute status
    const updatedMembership = await prisma.channelMember.update({
      where: { userId_channelId: { userId, channelId } },
      data: { isMuted: !membership.isMuted }
    });

    res.status(200).json({ message: 'Mute status updated', isMuted: updatedMembership.isMuted });
  } catch (error) {
    console.error('Toggle Mute Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, isPublic } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const existingChannel = await prisma.channel.findUnique({ where: { name } });
    if (existingChannel) {
      return res.status(409).json({ error: 'Channel name already exists' });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        isPublic,
        createdById: userId,
        members: {
          create: {
            userId: userId
          }
        }
      },
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create Channel Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyChannels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const memberships = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });

    res.status(200).json(memberships.map(m => m.channelId));
  } catch (error) {
    console.error('Get My Channels Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChannels = async (req: Request, res: Response) => {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });
    res.status(200).json(channels);
  } catch (error) {
    console.error('Get Channels Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, isPublic } = req.body;

    const channel = await prisma.channel.update({
      where: { id },
      data: { name, isPublic },
    });

    res.status(200).json(channel);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Channel not found' });
    }
    console.error('Update Channel Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Prisma doesn't cascade deletes by default in MongoDB without application logic or specific config,
    // so we delete related members and messages first.
    await prisma.channelMember.deleteMany({ where: { channelId: id } });
    await prisma.message.deleteMany({ where: { channelId: id } });

    await prisma.channel.delete({ where: { id } });

    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Channel not found' });
    }
    console.error('Delete Channel Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinChannel = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if channel exists
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    // In a real app, we'd check if channel is public before allowing any member to join without invite
    if (!channel.isPublic) {
      // In this demo, maybe we allow joining anyway or reject if not admin. We'll reject for now.
      return res.status(403).json({ error: 'Cannot join private channel directly' });
    }

    const membership = await prisma.channelMember.create({
      data: {
        userId,
        channelId,
      },
    });

    res.status(200).json({ message: 'Successfully joined channel', membership });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You are already a member of this channel' });
    }
    console.error('Join Channel Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveChannel = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;
    const userId = req.user?.userId;
    const successorId = req.body.successorId as string | undefined;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Enforce Admin leaving rules
    if (user.role === 'ADMIN') {
      const otherMembersCount = await prisma.channelMember.count({
        where: { channelId, userId: { not: userId } }
      });

      if (otherMembersCount > 0) {
        if (!successorId) {
          return res.status(400).json({ error: 'You must transfer Admin privileges before leaving a populated channel' });
        }

        // Verify successor is in the channel
        const successorMembership = await prisma.channelMember.findUnique({
          where: { userId_channelId: { userId: successorId, channelId } }
        });

        if (!successorMembership) {
          return res.status(400).json({ error: 'Selected successor is not a member of this channel' });
        }

        // Transfer roles
        await prisma.$transaction([
          prisma.user.update({
            where: { id: successorId },
            data: { role: 'ADMIN' }
          }),
          prisma.user.update({
            where: { id: userId },
            data: { role: 'MEMBER' }
          })
        ]);
      }
    }

    // Finally leave the channel
    await prisma.channelMember.delete({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    });

    res.status(200).json({ message: 'Successfully left channel' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'You are not a member of this channel' });
    }
    console.error('Leave Channel Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChannelMembers = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      }
    });

    res.status(200).json(members);
  } catch (error) {
    console.error('Get Channel Members Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const muteMember = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;
    const { userId, isMuted } = req.body;

    // Validate the target user is in the channel and get their role
    const membership = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
      include: { user: true }
    });

    if (!membership) {
      return res.status(404).json({ error: 'User is not a member of this channel' });
    }

    // Verify Hierarchy
    if (membership.user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot mute an Admin' });
    }
    
    // Moderators can only mute Members, not other Moderators
    if (req.user?.role === 'MODERATOR' && membership.user.role !== 'MEMBER') {
      return res.status(403).json({ error: 'Moderators can only mute regular Members' });
    }

    const updated = await prisma.channelMember.update({
      where: { userId_channelId: { userId, channelId } },
      data: { isMuted: Boolean(isMuted) },
    });

    res.status(200).json({ message: `User ${isMuted ? 'muted' : 'unmuted'} successfully`, membership: updated });
  } catch (error) {
    console.error('Mute Member Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;
    const userId = req.user?.userId;
    const cursor = req.query.cursor as string | undefined;
    const take = 50;

    // Verify channel exists and user is a member (privacy check)
    const membership = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId: userId!, channelId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, email: true, role: true }
        }
      }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id as string;
    const { userId } = req.body;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const userToAdd = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const membership = await prisma.channelMember.create({
      data: {
        userId,
        channelId,
      },
    });

    res.status(201).json({ message: 'User added to channel', membership });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User is already a member' });
    }
    console.error('Add Member Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
