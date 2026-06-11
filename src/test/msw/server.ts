// MSW Node server — Vitest (jsdom) testlari uchun.
// `setup.ts` bu server lifecycle ni boshqaradi.
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
