import type { RequestHandler } from 'express';
import * as usersService from './users.service';
import type { UpdateMeInput } from './users.schemas';
import { AppError } from '../../utils/AppError';

function getAuthOrThrow(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) {
    throw AppError.unauthorized();
  }
  return req.auth;
}

export const getMe: RequestHandler = async (req, res) => {
  const auth = getAuthOrThrow(req);
  const user = await usersService.getMe(auth.userId);
  res.json(user);
};

export const updateMe: RequestHandler<Record<string, string>, unknown, UpdateMeInput> = async (
  req,
  res,
) => {
  const auth = getAuthOrThrow(req);
  const user = await usersService.updateMe(auth.userId, req.body);
  res.json(user);
};

export const deleteMe: RequestHandler = async (req, res) => {
  const auth = getAuthOrThrow(req);
  const request = await usersService.requestAccountDeletion(auth.userId);
  res.status(202).json({
    message:
      'Solicitação de exclusão registrada. A conta será removida após o período de carência.',
    scheduledFor: request.scheduledFor,
    requestedAt: request.requestedAt,
  });
};

export const exportMe: RequestHandler = async (req, res) => {
  const auth = getAuthOrThrow(req);
  const data = await usersService.exportUserData(auth.userId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="kybyra-data-export.json"');
  res.send(JSON.stringify(data, null, 2));
};
