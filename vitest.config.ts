/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vitest konfiguratsiyasi: jsdom muhiti, RTL + jest-dom + jest-axe matcherlari,
// global test API va `@` alias. fast-check va MSW shu setup orqali ulanadi.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec,pbt.test}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/test/**', '**/*.d.ts', '**/*.config.*'],
    },
  },
})
