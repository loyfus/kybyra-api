import serverless from 'serverless-http';
import { initSentry } from '../src/config/sentry';
import { buildApp } from '../src/app';

initSentry();

const app = buildApp();

export default serverless(app);
