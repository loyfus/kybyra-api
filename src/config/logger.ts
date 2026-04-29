import pino from 'pino';
import { env } from './env';

const loggerConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: 'kybyra-api' },
};

if (env.NODE_ENV === 'development') {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname,service',
    },
  };
}

export const logger = pino(loggerConfig);

export type Logger = typeof logger;
