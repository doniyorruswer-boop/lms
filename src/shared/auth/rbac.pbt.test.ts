/**
 * Property-based tests for RBAC (Role-Based Access Control) and routing logic.
 *
 * Property 1: For any role, startPathForRole(role) returns a URL that isRouteAllowed(url, role) === true
 * Property 2: For any (role, pathname) pair, isRouteAllowed correctly enforces the route policies
 */

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { startPathForRole, isRouteAllowed, routePolicies } from "./rbac"
import { arbRole } from "../../test/generators"
import type { Role } from "../types/auth"

describe("RBAC and routing properties", () => {
  // Tizimdagi barcha rollar uchun umumiy generator (src/test/generators.ts).
  const roleArb = arbRole as fc.Arbitrary<Role>
  
  // Generator for pathnames (including valid routes and edge cases)
  const pathnameArb = fc.oneof(
    // Valid route prefixes
    fc.constantFrom("/student", "/teacher", "/admin", "/monitoring"),
    // Valid routes with sub-paths
    fc.constantFrom("/student/dashboard", "/teacher/dashboard", "/admin/dashboard", "/monitoring/dashboard"),
    fc.constantFrom("/student/courses", "/teacher/courses", "/admin/users", "/monitoring/stats"),
    // Edge cases
    fc.constantFrom("/", "/unknown", "/administrator", "/students", "/adminpanel"),
    // Generated paths
    fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}`),
    // Paths that start with valid prefixes but might not be valid sub-routes
    fc.tuple(fc.constantFrom("/student", "/teacher", "/admin", "/monitoring"), fc.string())
      .map(([prefix, suffix]) => `${prefix}${suffix}`)
  )

  // **Property 1: Roldan boshlang'ich sahifaga to'g'ri yo'naltirish**
  // **Validates: Requirements 1.2, 2.2, 2.3, 2.4, 2.5**
  describe("Property 1: Roldan boshlang'ich sahifaga to'g'ri yo'naltirish", () => {
    it("startPathForRole(role) ga isRouteAllowed har doim true qaytaradi", () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const initialPath = startPathForRole(role)

          // Asosiy xususiyat: rolning boshlang'ich sahifasi shu rol uchun
          // ruxsat etilgan bo'lishi shart (Req 1.2 — login keyin to'g'ri panelga
          // yo'naltirish).
          expect(isRouteAllowed(initialPath, role)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("har bir rol o'ziga biriktirilgan panelga yo'naltiriladi", () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const initialPath = startPathForRole(role)

          // Rol → panel boshlang'ich URL moslashuvi (Req 2.2–2.5).
          const expectedPaths: Record<Role, string> = {
            STUDENT: "/student/dashboard", // Req 2.5
            TEACHER: "/teacher/dashboard", // Req 2.4
            OTM_ADMIN: "/admin/dashboard", // Req 2.3
            DEKAN: "/admin/dashboard", // Req 2.3
            SUPER_ADMIN: "/monitoring/dashboard", // Req 2.2
          }

          expect(initialPath).toBe(expectedPaths[role])
        }),
        { numRuns: 100 }
      )
    })

    it("barcha boshlang'ich URL lar to'g'ri shakllangan dashboard yo'llari", () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const initialPath = startPathForRole(role)

          // Barcha boshlang'ich yo'llar /dashboard bilan tugaydi va to'g'ri
          // shakllangan absolyut yo'l bo'ladi.
          expect(initialPath.endsWith("/dashboard")).toBe(true)
          expect(initialPath.startsWith("/")).toBe(true)
          expect(initialPath.length).toBeGreaterThan(1)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property 2: Rolga asoslangan kirishni nazorat qilish to'g'riligi", () => {
    it("isRouteAllowed correctly enforces route policies", () => {
      fc.assert(
        fc.property(
          fc.tuple(roleArb, pathnameArb),
          ([role, pathname]) => {
            const isAllowed = isRouteAllowed(pathname, role)
            
            // Find the most specific matching policy
            let matchingPolicy = null
            let longestMatch = -1
            
            for (const policy of routePolicies) {
              const matches = pathname === policy.path || pathname.startsWith(`${policy.path}/`)
              if (matches && policy.path.length > longestMatch) {
                matchingPolicy = policy
                longestMatch = policy.path.length
              }
            }
            
            if (matchingPolicy) {
              // If there's a matching policy, access should be allowed iff role is in allowedRoles
              expect(isAllowed).toBe(matchingPolicy.allowedRoles.includes(role))
            } else {
              // No matching policy means deny by default
              expect(isAllowed).toBe(false)
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    it("deny-by-default for undeclared routes", () => {
      fc.assert(
        fc.property(
          fc.tuple(roleArb, fc.string().filter(s => 
            !s.startsWith("/student") && 
            !s.startsWith("/teacher") && 
            !s.startsWith("/admin") && 
            !s.startsWith("/monitoring") &&
            s.length > 0
          )),
          ([role, invalidPath]) => {
            const pathname = invalidPath.startsWith("/") ? invalidPath : `/${invalidPath}`
            
            // Routes not matching any policy should be denied
            expect(isRouteAllowed(pathname, role)).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    it("segment boundary matching prevents false positives", () => {
      const testCases = [
        { path: "/administrators", shouldMatch: "/admin", expected: false },
        { path: "/students", shouldMatch: "/student", expected: false },
        { path: "/teaching", shouldMatch: "/teacher", expected: false },
        { path: "/adminpanel", shouldMatch: "/admin", expected: false }
      ]
      
      for (const testCase of testCases) {
        fc.assert(
          fc.property(roleArb, (role) => {
            const isAllowed = isRouteAllowed(testCase.path, role)
            
            // These paths should NOT match their similar prefixes
            // They should all be denied (no matching policy)
            expect(isAllowed).toBe(false)
          }),
          { numRuns: 25 }
        )
      }
    })

    it("sub-routes inherit parent policy", () => {
      const subRouteTestCases = [
        { parentPath: "/student", subPath: "/student/courses", roles: ["STUDENT"] },
        { parentPath: "/teacher", subPath: "/teacher/assignments", roles: ["TEACHER"] },
        { parentPath: "/admin", subPath: "/admin/users/create", roles: ["OTM_ADMIN", "DEKAN"] },
        { parentPath: "/monitoring", subPath: "/monitoring/reports", roles: ["SUPER_ADMIN"] }
      ]
      
      for (const testCase of subRouteTestCases) {
        fc.assert(
          fc.property(roleArb, (role) => {
            const isAllowed = isRouteAllowed(testCase.subPath, role)
            const shouldBeAllowed = testCase.roles.includes(role)
            
            expect(isAllowed).toBe(shouldBeAllowed)
          }),
          { numRuns: 25 }
        )
      }
    })

    it("exact path matches work correctly", () => {
      const exactMatchTestCases = [
        { path: "/student", allowedRoles: ["STUDENT"] },
        { path: "/teacher", allowedRoles: ["TEACHER"] },
        { path: "/admin", allowedRoles: ["OTM_ADMIN", "DEKAN"] },
        { path: "/monitoring", allowedRoles: ["SUPER_ADMIN"] }
      ]
      
      for (const testCase of exactMatchTestCases) {
        fc.assert(
          fc.property(roleArb, (role) => {
            const isAllowed = isRouteAllowed(testCase.path, role)
            const shouldBeAllowed = testCase.allowedRoles.includes(role)
            
            expect(isAllowed).toBe(shouldBeAllowed)
          }),
          { numRuns: 25 }
        )
      }
    })

    it("most specific policy wins for nested paths", () => {
      // If we had nested policies, the most specific should win
      // For now, we test that longer path prefixes take precedence
      fc.assert(
        fc.property(
          fc.tuple(roleArb, fc.constantFrom("/admin", "/admin/users", "/admin/users/create")),
          ([role, pathname]) => {
            const isAllowed = isRouteAllowed(pathname, role)
            
            // All these should be governed by the /admin policy
            const shouldBeAllowed = ["OTM_ADMIN", "DEKAN"].includes(role)
            expect(isAllowed).toBe(shouldBeAllowed)
          }
        ),
        { numRuns: 25 }
      )
    })

    it("role-to-panel mapping is consistent", () => {
      const expectedMappings = {
        STUDENT: "/student",
        TEACHER: "/teacher", 
        OTM_ADMIN: "/admin",
        DEKAN: "/admin",
        SUPER_ADMIN: "/monitoring"
      }
      
      fc.assert(
        fc.property(roleArb, (role) => {
          const expectedPanel = expectedMappings[role]
          
          // Each role should have access to their designated panel
          expect(isRouteAllowed(expectedPanel, role)).toBe(true)
          expect(isRouteAllowed(`${expectedPanel}/dashboard`, role)).toBe(true)
          
          // But not to other panels
          for (const [otherRole, otherPanel] of Object.entries(expectedMappings)) {
            if (otherRole !== role && otherPanel !== expectedPanel) {
              expect(isRouteAllowed(otherPanel, role)).toBe(false)
            }
          }
        }),
        { numRuns: 25 }
      )
    })
  })
})