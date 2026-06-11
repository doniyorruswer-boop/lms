/**
 * SCORM status -> xAPI verb mapping (pure, side-effect-free).
 *
 * `mapScormStatusToXapi` converts a SCORM 1.2 `cmi.core.lesson_status` value
 * or its SCORM 2004 equivalent (`cmi.completion_status` / `cmi.success_status`)
 * into exactly one xAPI verb. The mapping is **total** (every input yields a
 * verb) and **deterministic** (the same input always yields the same verb),
 * so it can be covered by property-based tests and consumed by the
 * SCORM_Player when posting xAPI statements to the backend.
 *
 * See design.md "Property 11: SCORM status -> xAPI hodisaga mapping".
 *
 * Validates: Requirements 6.3
 */

/**
 * Canonical xAPI verbs produced by the mapping. Each corresponds to an ADL
 * verb IRI from the xAPI vocabulary.
 */
export type XapiVerbId =
  | "completed"
  | "passed"
  | "failed"
  | "progressed"
  | "experienced"
  | "initialized";

/**
 * An xAPI verb descriptor: a stable IRI plus an English display label, shaped
 * for direct embedding into an xAPI statement's `verb` object.
 */
export interface XapiVerb {
  /** Verb identifier key (short canonical name). */
  id: XapiVerbId;
  /** Fully-qualified ADL verb IRI. */
  iri: string;
  /** English display label. */
  display: string;
}

const ADL_VERB_BASE = "http://adlnet.gov/expapi/verbs/";

const VERBS: Record<XapiVerbId, XapiVerb> = {
  completed: { id: "completed", iri: `${ADL_VERB_BASE}completed`, display: "completed" },
  passed: { id: "passed", iri: `${ADL_VERB_BASE}passed`, display: "passed" },
  failed: { id: "failed", iri: `${ADL_VERB_BASE}failed`, display: "failed" },
  progressed: { id: "progressed", iri: `${ADL_VERB_BASE}progressed`, display: "progressed" },
  experienced: { id: "experienced", iri: `${ADL_VERB_BASE}experienced`, display: "experienced" },
  initialized: { id: "initialized", iri: `${ADL_VERB_BASE}initialized`, display: "initialized" },
};

/**
 * Canonical (normalized) SCORM status keys recognised by the mapping. Both the
 * SCORM 1.2 spelling (`"not attempted"`) and the SCORM 2004 spelling
 * (`"not_attempted"`) normalize to the same key, and the SCORM 2004-only
 * `"unknown"` status is included.
 */
type CanonicalScormStatus =
  | "completed"
  | "incomplete"
  | "passed"
  | "failed"
  | "browsed"
  | "not_attempted"
  | "unknown";

/**
 * Deterministic mapping from each canonical SCORM status to its xAPI verb.
 *
 * - completed     -> completed   (content marked complete)
 * - passed        -> passed      (success criteria met)
 * - failed        -> failed      (success criteria not met)
 * - incomplete    -> progressed  (attempt under way, not yet complete)
 * - browsed       -> experienced (browse mode, no scoring)
 * - not attempted -> initialized (attempt registered, no progress yet)
 * - unknown       -> initialized (2004 indeterminate state)
 */
const STATUS_TO_VERB: Record<CanonicalScormStatus, XapiVerbId> = {
  completed: "completed",
  passed: "passed",
  failed: "failed",
  incomplete: "progressed",
  browsed: "experienced",
  not_attempted: "initialized",
  unknown: "initialized",
};

/**
 * Normalize a raw SCORM status string to a canonical key.
 *
 * Handles case differences, surrounding whitespace, and the SCORM 1.2 (space)
 * vs SCORM 2004 (underscore) spelling of multi-word statuses. Any unrecognised
 * value normalizes to `"unknown"`, keeping the overall mapping total.
 */
function normalizeStatus(status: string): CanonicalScormStatus {
  const key = status.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (key) {
    case "completed":
      return "completed";
    case "incomplete":
      return "incomplete";
    case "passed":
      return "passed";
    case "failed":
      return "failed";
    case "browsed":
      return "browsed";
    case "not_attempted":
      return "not_attempted";
    default:
      // Includes SCORM 2004 "unknown" and any unexpected value.
      return "unknown";
  }
}

/**
 * Map a SCORM 1.2 / 2004 status to exactly one xAPI verb.
 *
 * The mapping is total and deterministic: every string input yields a verb,
 * and identical inputs always yield the same verb. Recognised SCORM 1.2
 * (`"not attempted"`) and SCORM 2004 (`"not_attempted"`, `"unknown"`) spellings
 * are normalized before lookup.
 *
 * @param status - Raw SCORM status value (e.g. from `cmi.core.lesson_status`).
 * @returns The corresponding xAPI verb descriptor.
 */
export function mapScormStatusToXapi(status: string): XapiVerb {
  const canonical = normalizeStatus(status);
  return VERBS[STATUS_TO_VERB[canonical]];
}
