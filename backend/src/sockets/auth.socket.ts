import { Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';

// Extend Socket to include user data
export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: Missing token'));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.user = payload;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
};
