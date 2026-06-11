/**
 * Property-based tests for RBAC and initial route redirection (PBT Tasks 4.2, 4.3).
 *
 * **Property 1: Roldan boshlang'ich sahifaga to'g'ri yo'naltirish**
 * **Property 2: Rolga asoslangan kirishni nazorat qilish to'g'riligi**
 * **Validates: Requirements 1.2, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8**
 *
 * Tests the pure RBAC functions to ensure correct role-based route access
 * and initial page redirection logic.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { startPathForRole, isRouteAllowed, routePolicies } from './rbac'
import { arbRole, arbPath, ROLES } from '@/test/generators'

describe('RBAC property testlari', () => {
  describe('Property 1: Roldan boshlang\'ich sahifaga to\'g\'ri yo\'naltirish', () => {
    it('Property 1a: Har qanday rol uchun startPathForRole natijasi o\'sha rolga ruxsat etilgan', () => {
      fc.assert(
        fc.property(arbRole, (role) => {
          const startPath = startPathForRole(role)
          const isAllowed = isRouteAllowed(startPath, role)
          
          // Property: start path should always be allowed for the role
          expect(isAllowed).toBe(true)
          
          // Additional verification: start path should be a string and not empty
          expect(typeof startPath).toBe('string')
          expect(startPath.length).toBeGreaterThan(0)
          expect(startPath).toMatch(/^\/\w+/) // Should start with / followed by word chars
        }),
        { numRuns: 100 }
      )
    })

    it('Property 1b: Rol → boshlang\'ich URL mapping deterministic va to\'liq', () => {
      fc.assert(
        fc.property(arbRole, (role) => {
          const startPath1 = startPathForRole(role)
          const startPath2 = startPathForRole(role)
          
          // Deterministic: same input should give same output
          expect(startPath1).toBe(startPath2)
          
          // Complete mapping: every role should have a defined start path
          expect(startPath1).toBeDefined()
          expect(startPath1).not.toBe('')
        }),
        { numRuns: 50 }
      )
    })

    it('Property 1c: Aniq rol mappinglari requirements asosida to\'g\'ri', () => {
      // Req 2.2-2.5 requirements based on design spec
      const expectedMappings = {
        STUDENT: '/student/dashboard',
        TEACHER: '/teacher/dashboard', 
        OTM_ADMIN: '/admin/dashboard',
        DEKAN: '/admin/dashboard',
        SUPER_ADMIN: '/monitoring/dashboard'
      }

      for (const [role, expectedPath] of Object.entries(expectedMappings)) {
        expect(startPathForRole(role as any)).toBe(expectedPath)
      }
    })

    it('Property 1d: Barcha rollar uchun start path lar unique (DEKAN/OTM_ADMIN bundan mustasno)', () => {
      const startPaths = ROLES.map(role => startPathForRole(role))
      const uniquePaths = new Set(startPaths)
      
      // OTM_ADMIN va DEKAN bir xil admin panel ga boradilar
      expect(uniquePaths.size).toBe(4) // 5 roles but OTM_ADMIN/DEKAN share same path
      
      // Verify specific shared mapping
      expect(startPathForRole('OTM_ADMIN')).toBe(startPathForRole('DEKAN'))
    })
  })

  describe('Property 2: Rolga asoslangan kirishni nazorat qilish to\'g\'riligi', () => {
    it('Property 2a: routePolicies eng aniq mos kelishiga asoslangan kirishni nazorat qilish', () => {
      fc.assert(
        fc.property(
          arbRole,
          arbPath,
          (role, pathname) => {
            const isAllowed = isRouteAllowed(pathname, role)
            
            // Find the most specific matching policy manually
            let bestPolicy = null
            for (const policy of routePolicies) {
              const matches = pathname === policy.path || pathname.startsWith(`${policy.path}/`)
              if (matches && (!bestPolicy || policy.path.length > bestPolicy.path.length)) {
                bestPolicy = policy
              }
            }

            if (!bestPolicy) {
              // No policy matches → should deny (default deny)
              expect(isAllowed).toBe(false)
            } else {
              // Policy found → check if role is in allowed roles
              const expectedAllowed = bestPolicy.allowedRoles.includes(role)
              expect(isAllowed).toBe(expectedAllowed)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 2b: Segment-boundary path matching xususiyati', () => {
      fc.assert(
        fc.property(
          arbRole,
          fc.constantFrom('/admin', '/student', '/teacher', '/monitoring'),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z]+$/.test(s)),
          (role, policyPath, suffix) => {
            // Test exact path match
            const exactMatch = isRouteAllowed(policyPath, role)
            
            // Test sub-path match (with segment boundary)
            const subPath = `${policyPath}/${suffix}`
            const subPathMatch = isRouteAllowed(subPath, role)
            
            // Test non-segment continuation (should not match)
            const nonSegmentPath = `${policyPath}${suffix}` // no slash
            const nonSegmentMatch = isRouteAllowed(nonSegmentPath, role)
            
            // Property: exact match and sub-path should give same result
            expect(exactMatch).toBe(subPathMatch)
            
            // Property: non-segment continuation should not match
            // (unless there's another policy that matches it)
            const hasOtherPolicy = routePolicies.some(p => 
              p.path !== policyPath && 
              (nonSegmentPath === p.path || nonSegmentPath.startsWith(`${p.path}/`))
            )
            
            if (!hasOtherPolicy) {
              expect(nonSegmentMatch).toBe(false)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 2c: Eng uzun prefiksli siyosat ustuvorligi', () => {
      // Test that more specific paths take precedence over general ones
      const testCases = [
        { path: '/admin', expectedPolicy: '/admin' },
        { path: '/admin/users', expectedPolicy: '/admin' },
        { path: '/admin/courses/123', expectedPolicy: '/admin' },
        { path: '/student', expectedPolicy: '/student' },
        { path: '/student/dashboard', expectedPolicy: '/student' },
        { path: '/monitoring/reports', expectedPolicy: '/monitoring' }
      ]

      for (const { path, expectedPolicy } of testCases) {
        for (const role of ROLES) {
          const isAllowed = isRouteAllowed(path, role)
          const policy = routePolicies.find(p => p.path === expectedPolicy)!
          const expected = policy.allowedRoles.includes(role)
          
          expect(isAllowed).toBe(expected)
        }
      }
    })

    it('Property 2d: Deklaratsiya qilinmagan marshrutlar uchun default deny', () => {
      fc.assert(
        fc.property(
          arbRole,
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => 
            s.startsWith('/') && 
            !routePolicies.some(p => 
              s === p.path || s.startsWith(`${p.path}/`)
            )
          ),
          (role, undeclaredPath) => {
            const isAllowed = isRouteAllowed(undeclaredPath, role)
            
            // Property: undeclared routes should be denied by default
            expect(isAllowed).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Route policies consistency va completeness', () => {
    it('Property 2e: Har bir start path uchun mos siyosat mavjud', () => {
      fc.assert(
        fc.property(arbRole, (role) => {
          const startPath = startPathForRole(role)
          
          // There should be a policy that matches this start path
          const matchingPolicy = routePolicies.find(p => 
            startPath === p.path || startPath.startsWith(`${p.path}/`)
          )
          
          expect(matchingPolicy).toBeDefined()
          expect(matchingPolicy!.allowedRoles).toContain(role)
        }),
        { numRuns: 50 }
      )
    })

    it('Property 2f: Siyosat yo\'llari unique va overlap mavjud emas', () => {
      const policyPaths = routePolicies.map(p => p.path)
      const uniquePaths = new Set(policyPaths)
      
      // All policy paths should be unique
      expect(uniquePaths.size).toBe(policyPaths.length)
      
      // No policy path should be a prefix of another (would create ambiguity)
      for (let i = 0; i < policyPaths.length; i++) {
        for (let j = i + 1; j < policyPaths.length; j++) {
          const path1 = policyPaths[i]!
          const path2 = policyPaths[j]!
          
          expect(path1.startsWith(`${path2}/`)).toBe(false)
          expect(path2.startsWith(`${path1}/`)).toBe(false)
        }
      }
    })

    it('Property 2g: Barcha rollar kamida bitta siyosatda mavjud', () => {
      for (const role of ROLES) {
        const policiesWithRole = routePolicies.filter(p => 
          p.allowedRoles.includes(role)
        )
        
        expect(policiesWithRole.length).toBeGreaterThan(0)
      }
    })

    it('Property 2h: Critical paths accessibility check', () => {
      // Verify that each role can access their designated areas
      const criticalAccessChecks = [
        { role: 'STUDENT' as const, path: '/student/courses', shouldAllow: true },
        { role: 'TEACHER' as const, path: '/teacher/courses', shouldAllow: true },
        { role: 'OTM_ADMIN' as const, path: '/admin/users', shouldAllow: true },
        { role: 'DEKAN' as const, path: '/admin/courses', shouldAllow: true },
        { role: 'SUPER_ADMIN' as const, path: '/monitoring/stats', shouldAllow: true },
        
        // Cross-role access should be denied
        { role: 'STUDENT' as const, path: '/admin/users', shouldAllow: false },
        { role: 'TEACHER' as const, path: '/monitoring/stats', shouldAllow: false },
        { role: 'OTM_ADMIN' as const, path: '/student/courses', shouldAllow: false }
      ]

      for (const { role, path, shouldAllow } of criticalAccessChecks) {
        expect(isRouteAllowed(path, role)).toBe(shouldAllow)
      }
    })
  })

  describe('Integration property: start path → access consistency', () => {
    it('Property 1+2: Rol → start path → access round-trip consistency', () => {
      fc.assert(
        fc.property(arbRole, (role) => {
          const startPath = startPathForRole(role)
          const canAccess = isRouteAllowed(startPath, role)
          
          // Integration property: every role should be able to access their start path
          expect(canAccess).toBe(true)
          
          // Verify start path leads to appropriate panel
          if (role === 'STUDENT') {
            expect(startPath).toMatch(/^\/student/)
          } else if (role === 'TEACHER') {
            expect(startPath).toMatch(/^\/teacher/)
          } else if (role === 'OTM_ADMIN' || role === 'DEKAN') {
            expect(startPath).toMatch(/^\/admin/)
          } else if (role === 'SUPER_ADMIN') {
            expect(startPath).toMatch(/^\/monitoring/)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})