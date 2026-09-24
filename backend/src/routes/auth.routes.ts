import { Router } from 'express';
import { register, login, getMe, refresh, logout } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
