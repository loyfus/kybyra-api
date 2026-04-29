// Loaded by Jest before any test/module — sets the env vars required by
// `src/config/env.ts` so importing modules under test does not exit the process.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/kybyra_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'unit-test-access-secret-at-least-16-chars';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-at-least-16-chars';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';
process.env.LOG_LEVEL = 'silent';
