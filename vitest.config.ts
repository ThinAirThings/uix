/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        testTimeout: 10000,
        exclude: [
            "**/composite.test.ts",
            '**/node_modules/**',
            '**/dist/**',
        ]
    },
})