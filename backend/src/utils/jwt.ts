import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-fallback';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-fallback';

const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};
