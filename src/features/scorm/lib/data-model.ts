/**
 * SCORM data model for property-based testing (Task 8.2).
 * 
 * This file exposes the ScormBridge for property testing of the round-trip
 * data model invariant. The actual bridge implementation is in bridge.ts.
 * 
 * **Property 10: SCORM data modelining round-trip integratsiyasi**
 * **Validates: Requirements 6.2**
 */

// Re-export the bridge for testing
export { ScormBridge } from './bridge'
export type { ScormVersion, CommitHandler, ScormBridgeOptions } from './bridge'