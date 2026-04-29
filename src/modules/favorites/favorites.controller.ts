import type { RequestHandler } from 'express';
import * as favService from './favorites.service';
import { AppError } from '../../utils/AppError';

function authOf(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const list: RequestHandler = async (req, res) => {
  const auth = authOf(req);
  const items = await favService.listFavorites(auth.userId);
  res.json(items);
};

export const add: RequestHandler<{ carId: string }> = async (req, res) => {
  const auth = authOf(req);
  const fav = await favService.addFavorite(auth.userId, req.params.carId);
  res.status(201).json(fav);
};

export const remove: RequestHandler<{ carId: string }> = async (req, res) => {
  const auth = authOf(req);
  await favService.removeFavorite(auth.userId, req.params.carId);
  res.status(204).send();
};
