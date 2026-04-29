import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'kybyra-api' },
});

export type Logger = typeof logger;
