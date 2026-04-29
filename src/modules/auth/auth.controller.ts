import type { RequestHandler } from 'express';
import * as authService from './auth.service';
import type { LoginInput, RefreshInput, RegisterInput } from './auth.schemas';

const meta = (req: Parameters<RequestHandler>[0]) => ({
  userAgent: req.get('user-agent') ?? undefined,
  ipAddress: req.ip,
});

export const register: RequestHandler<Record<string, string>, unknown, RegisterInput> = async (req, res) => {
  const result = await authService.register(req.body, meta(req));
  res.status(201).json(result);
};

export const login: RequestHandler<Record<string, string>, unknown, LoginInput> = async (req, res) => {
  const result = await authService.login(req.body, meta(req));
  res.json(result);
};

export const refresh: RequestHandler<Record<string, string>, unknown, RefreshInput> = async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken, meta(req));
  res.json(result);
};

export const logout: RequestHandler<Record<string, string>, unknown, RefreshInput> = async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
};
