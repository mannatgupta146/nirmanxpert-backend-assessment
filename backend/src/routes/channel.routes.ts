import { Router } from 'express';
import {
  createChannel,
  getChannels,
  getMyChannels,
  updateChannel,
  deleteChannel,
  joinChannel,
  leaveChannel,
  getChannelMembers,
  muteMember,
  getMessages,
  addMember,
} from '../controllers/channel.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createChannelSchema, updateChannelSchema, muteMemberSchema, addMemberSchema } from '../utils/validators';

const router = Router();

// All channel routes require authentication
router.use(authenticate);

// Publicly readable endpoints (for authenticated users)
router.get('/', getChannels);
router.get('/me', getMyChannels);
router.get('/:id/members', getChannelMembers);
router.get('/:id/messages', getMessages);

// Joining / Leaving Channels (Any authenticated user)
router.post('/:id/join', joinChannel);
router.post('/:id/leave', leaveChannel);

// Admin restricted endpoints
router.post('/', requireRole(['ADMIN']), validateBody(createChannelSchema), createChannel);
router.put('/:id', requireRole(['ADMIN']), validateBody(updateChannelSchema), updateChannel);
router.delete('/:id', requireRole(['ADMIN']), deleteChannel);
router.post('/:id/members', requireRole(['ADMIN']), validateBody(addMemberSchema), addMember);

// Moderator / Admin restricted endpoints
router.post('/:id/mute', requireRole(['ADMIN', 'MODERATOR']), validateBody(muteMemberSchema), muteMember);

export default router;
