import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
};

export function signAccessToken(payload: { sub: string; email: string }): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: { sub: string; jti: string }): string {
  // jsonwebtoken throws if `jti` is in payload AND `jwtid` is in options.
  // We keep it in the payload only so that verify() returns it.
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string' || decoded.type !== 'access') {
    throw new Error('Invalid access token payload');
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded === 'string' || decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token payload');
  }
  return decoded as RefreshTokenPayload;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateJti(): string {
  return crypto.randomBytes(16).toString('hex');
}
