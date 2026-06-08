import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.integration.test.ts'],
        env: {
            DATABASE_URL: 'postgresql://test:test@127.0.0.1:59999/alentapp_integration',
            NODE_ENV: 'test',
        },
    },
});
