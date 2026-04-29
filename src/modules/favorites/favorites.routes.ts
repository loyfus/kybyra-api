import { Router } from 'express';
import * as favController from './favorites.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', favController.list);
router.post('/:carId', favController.add);
router.delete('/:carId', favController.remove);

export default router;
