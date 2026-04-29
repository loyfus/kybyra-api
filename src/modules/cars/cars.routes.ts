import { Router } from 'express';
import * as carsController from './cars.controller';

const router = Router();

// IMPORTANT: register `/brands` before `/:slug` so it isn't matched as a slug.
router.get('/brands', carsController.brands);
router.get('/', carsController.list);
router.get('/:slug', carsController.detail);

export default router;
