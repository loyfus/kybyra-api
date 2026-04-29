import type { RequestHandler } from 'express';
import { Router } from 'express';
import { decodeVin } from './vin.service';

const decode: RequestHandler<{ vin: string }> = async (req, res) => {
  const result = await decodeVin(req.params.vin);
  res.json(result);
};

const router = Router();
router.get('/decode/:vin', decode);

export default router;
