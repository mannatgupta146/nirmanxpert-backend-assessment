import { Request, Response } from 'express';
import prisma from '../config/db';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent an admin from accidentally demoting themselves if they are the only admin
    if (userId === req.user?.userId && role !== 'ADMIN') {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    // Prevent promoting other users to Admin
    if (role === 'ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to promote users to Admin' });
    }

    // Protect the original system administrator from being demoted by anyone
    if (user.email === 'admin@test.com') {
      return res.status(403).json({ error: 'Cannot modify the role of the original system administrator' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    res.status(200).json({ message: 'Role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
