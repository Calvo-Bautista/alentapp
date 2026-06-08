import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

loadEnv({ path: fileURLToPath(new URL('.env.test', import.meta.url)) });

export default defineConfig({
    test: {
        include: ['src/**/*.e2e.test.ts'],
    },
});
