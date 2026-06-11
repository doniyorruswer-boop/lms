// Global test setup: RTL jest-dom matcherlari, jest-axe a11y matcheri,
// har test oxirida DOM tozalash va MSW server lifecycle.
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { server } from './msw/server'

// jest-axe matcherini Vitest expect ga qo'shamiz (a11y testlari uchun).
expect.extend(toHaveNoViolations)

// MSW: testlardan oldin tinglashni boshlaymiz, har testdan keyin
// handlerlarni qayta tiklaymiz, oxirida yopamiz.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
