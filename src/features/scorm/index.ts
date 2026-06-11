// SCORM_Player feature public API (Req 6).
export { ScormPlayer, default } from './ScormPlayer'
export type { ScormPlayerProps } from './ScormPlayer'

// Toza logika (data-model/lifecycle bridge, status -> xAPI mapping, shim, post).
export { ScormBridge } from './lib/bridge'
export type {
  ScormVersion,
  CommitHandler,
  ScormBridgeOptions,
  ScormLifecycleState,
} from './lib/bridge'
export { mapScormStatusToXapi } from './lib/xapi-map'
export type { XapiVerb, XapiVerbId } from './lib/xapi-map'
export {
  createScormShim,
  extractStatus,
  statusKeysFor,
  STATUS_KEYS_12,
  STATUS_KEYS_2004,
} from './lib/scorm-shim'
export {
  buildScormXapiStatement,
  postScormXapi,
} from './lib/xapi-post'
export type { ScormXapiStatement, BuildXapiOptions } from './lib/xapi-post'
