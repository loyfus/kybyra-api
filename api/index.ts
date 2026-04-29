import serverless from 'serverless-http';
import { initSentry, Sentry } from '../src/config/sentry';
import { buildApp } from '../src/app';
import { prisma } from '../src/config/prisma';

initSentry();

const app = buildApp();
const handler = serverless(app);

export default async (req: any, res: any): Promise<any> => {
  try {
    return await handler(req, res);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore disconnect errors
    }
    try {
      await Sentry.flush(2000);
    } catch {
      // ignore flush errors when Sentry is not configured
    }
  }
};
