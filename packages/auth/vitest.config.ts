import { defineConfig } from 'vitest/config';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env.local') });

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
