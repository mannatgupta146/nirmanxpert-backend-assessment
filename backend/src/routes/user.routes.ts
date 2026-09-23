import { Router } from 'express';
import { updateRole, getAllUsers } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateRoleSchema } from '../utils/validators';

const router = Router();

// Only Admins can manage roles
router.get('/', authenticate, requireRole(['ADMIN', 'MODERATOR']), getAllUsers);
router.put('/:id/role', authenticate, requireRole(['ADMIN']), validateBody(updateRoleSchema), updateRole);

export default router;
