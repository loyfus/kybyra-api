import type { RequestHandler } from 'express';
import * as carsService from './cars.service';
import { listCarsQuerySchema } from './cars.schemas';

export const list: RequestHandler = async (req, res) => {
  // Express 5 makes `req.query` getter-only, so we parse here instead of via middleware.
  const query = listCarsQuerySchema.parse(req.query);
  const result = await carsService.listCars(query);
  res.json(result);
};

export const detail: RequestHandler<{ slug: string }> = async (req, res) => {
  const car = await carsService.getCarBySlug(req.params.slug);
  res.json(car);
};

export const brands: RequestHandler = async (_req, res) => {
  const list = await carsService.listBrands();
  res.json(list);
};
