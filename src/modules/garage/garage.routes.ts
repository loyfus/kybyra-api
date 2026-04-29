import { Router } from 'express';
import * as garageController from './garage.controller';
import { validate } from '../../middleware/validate';
import { addToGarageSchema, updateGarageSchema } from './garage.schemas';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', garageController.list);
router.post('/', validate(addToGarageSchema), garageController.add);
router.put('/:id', validate(updateGarageSchema), garageController.update);
router.delete('/:id', garageController.remove);

export default router;
