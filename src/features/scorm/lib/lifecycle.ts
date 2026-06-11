/**
 * SCORM lifecycle management for property-based testing (Task 8.3).
 * 
 * This file exposes the ScormBridge lifecycle functionality for testing
 * the terminate invariant. The actual bridge implementation is in bridge.ts.
 * 
 * **Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar bekor**
 * **Validates: Requirements 6.4**
 */

// Re-export the bridge for lifecycle testing
export { ScormBridge } from './bridge'
export type { ScormLifecycleState, CommitHandler, ScormBridgeOptions } from './bridge'