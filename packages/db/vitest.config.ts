import { defineConfig } from 'vitest/config';

process.loadEnvFile(new URL('../../.env.local', import.meta.url));

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl || testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must be configured separately from DATABASE_URL');
}
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
