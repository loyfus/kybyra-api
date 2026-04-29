import type { RequestHandler } from 'express';
import * as garageService from './garage.service';
import type { AddToGarageInput, UpdateGarageInput } from './garage.schemas';
import { AppError } from '../../utils/AppError';

function authOf(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const list: RequestHandler = async (req, res) => {
  const auth = authOf(req);
  const items = await garageService.listGarage(auth.userId);
  res.json(items);
};

export const add: RequestHandler<Record<string, string>, unknown, AddToGarageInput> = async (
  req,
  res,
) => {
  const auth = authOf(req);
  const entry = await garageService.addToGarage(auth.userId, req.body);
  res.status(201).json(entry);
};

export const update: RequestHandler<{ id: string }, unknown, UpdateGarageInput> = async (
  req,
  res,
) => {
  const auth = authOf(req);
  const entry = await garageService.updateGarageEntry(auth.userId, req.params.id, req.body);
  res.json(entry);
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  const auth = authOf(req);
  await garageService.removeFromGarage(auth.userId, req.params.id);
  res.status(204).send();
};
