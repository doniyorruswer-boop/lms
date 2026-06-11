/**
 * Property-based tests for login redirect helpers (task 4.5).
 *
 * **Property 3: Login redirect parametrining round-trip saqlanishi**
 * For any himoyalangan `originalPath` (string ichida `?#&` xarakterlari bo'lishi mumkin), 
 * `parseRedirectParam(buildLoginUrl(originalPath)) === originalPath`.
 *
 * **Validates: Requirements 2.7**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildLoginUrl, parseRedirectParam, LOGIN_PATH, REDIRECT_PARAM } from './redirect'

describe('Login redirect round-trip property (Property 3)', () => {
  it('should preserve originalPath through buildLoginUrl → parseRedirectParam round-trip', () => {
    fc.assert(
      fc.property(
        // Generate paths with special characters that could break URL encoding
        fc.string({ minLength: 0, maxLength: 200 }).filter(path => {
          // Allow various special characters including ?#&
          return true
        }),
        (originalPath) => {
          // Build login URL with the original path
          const loginUrl = buildLoginUrl(originalPath)
          
          // Parse the redirect parameter back out
          const parsedPath = parseRedirectParam(loginUrl)
          
          // The round-trip should preserve the original path exactly
          expect(parsedPath).toBe(originalPath)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle paths with query parameters and fragments', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_/-]+$/.test(s)),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 })
        ),
        ([basePath, queryPart, fragmentPart]) => {
          // Construct a complex path with query and fragment
          let originalPath = basePath
          if (queryPart) {
            originalPath += '?' + queryPart + '=value&another=param'
          }
          if (fragmentPart) {
            originalPath += '#' + fragmentPart
          }
          
          const loginUrl = buildLoginUrl(originalPath)
          const parsedPath = parseRedirectParam(loginUrl)
          
          expect(parsedPath).toBe(originalPath)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should generate valid login URLs with correct structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (originalPath) => {
          const loginUrl = buildLoginUrl(originalPath)
          
          // Should start with LOGIN_PATH
          expect(loginUrl).toMatch(new RegExp(`^${LOGIN_PATH}\\?`))
          
          // Should contain the redirect parameter
          expect(loginUrl).toContain(`${REDIRECT_PARAM}=`)
          
          // Should be a valid URL query structure
          const queryIndex = loginUrl.indexOf('?')
          expect(queryIndex).toBeGreaterThan(0)
          
          const queryPart = loginUrl.slice(queryIndex + 1)
          expect(queryPart).toMatch(new RegExp(`^${REDIRECT_PARAM}=`))
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should return null for URLs without redirect parameter', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/login'),
          fc.constant('/login?other=param'),
          fc.constant('/login?other=param&another=value'),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes(REDIRECT_PARAM))
        ),
        (urlWithoutRedirect) => {
          const parsed = parseRedirectParam(urlWithoutRedirect)
          expect(parsed).toBeNull()
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should handle edge cases correctly', () => {
    // Empty path
    expect(parseRedirectParam(buildLoginUrl(''))).toBe('')
    
    // Path with only special characters
    const specialPath = '?#&='
    expect(parseRedirectParam(buildLoginUrl(specialPath))).toBe(specialPath)
    
    // Very long path
    const longPath = '/very/long/path'.repeat(20)
    expect(parseRedirectParam(buildLoginUrl(longPath))).toBe(longPath)
    
    // Unicode characters
    const unicodePath = '/тест/测试/🔥'
    expect(parseRedirectParam(buildLoginUrl(unicodePath))).toBe(unicodePath)
  })
})