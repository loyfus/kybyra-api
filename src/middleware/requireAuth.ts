import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../modules/auth/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.get('authorization');
  if (!header) {
    next(AppError.unauthorized('Token não fornecido'));
    return;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    next(AppError.unauthorized('Formato Authorization inválido (esperado "Bearer <token>")'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Token inválido ou expirado'));
  }
};
