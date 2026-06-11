// Vitest expect ni jest-axe matcheri bilan kengaytirish uchun tip e'lonlari.
// _Requirements: 20.1 (test asosi)_
import 'vitest'

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void
  }
}
