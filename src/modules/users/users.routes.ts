import { Router } from 'express';
import * as usersController from './users.controller';
import { validate } from '../../middleware/validate';
import { updateMeSchema } from './users.schemas';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', usersController.getMe);
router.put('/', validate(updateMeSchema), usersController.updateMe);
router.delete('/', usersController.deleteMe);
router.get('/export', usersController.exportMe);

export default router;
