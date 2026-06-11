/**
 * Pure, framework-agnostic SCORM run-time bridge (data model + lifecycle).
 *
 * The SCORM_Player exposes a run-time API to the package loaded inside the
 * iframe through the `window.API` (SCORM 1.2) and `window.API_1484_11`
 * (SCORM 2004) global objects. This module isolates the *data model* and
 * *lifecycle* of that API as a small, side-effect free class so it can be
 * covered by property-based tests and consumed by the SCORM_Player UI.
 *
 * The only injected effect is the optional `onCommit` callback, which the UI
 * wires to the backend persistence call (`POST /scorm/xapi`). The bridge never
 * performs I/O itself.
 *
 * See design.md:
 *   - "Property 10: SCORM data modelining round-trip integratsiyasi" — after
 *     `setValue(key, value)`, `getValue(key)` returns the stored value
 *     unchanged.
 *   - "Property 12: SCORM lifecycle invariant — terminate keyin operatsiyalar
 *     bekor" — after `LMSFinish`/`Terminate`, any `setValue`/`getValue`/
 *     `commit` returns an error and no backend commit is sent.
 *
 * Requirements: 6.2 (round-trip data model), 6.4 (commit/finish lifecycle).
 *
 * Both standards are supported with their respective method names:
 *   - SCORM 1.2 : LMSInitialize / LMSGetValue / LMSSetValue / LMSCommit /
 *                 LMSFinish / LMSGetLastError / LMSGetErrorString / LMSGetDiagnostic
 *   - SCORM 2004: Initialize  / GetValue    / SetValue    / Commit    /
 *                 Terminate  / GetLastError / GetErrorString / GetDiagnostic
 *
 * Per the SCORM run-time spec every method returns a *string*: the boolean-ish
 * methods return `"true"`/`"false"`, `getValue` returns the stored value (or an
 * empty string), and the diagnostics return error codes/messages as strings.
 */

/** Supported SCORM standards. */
export type ScormVersion = "1.2" | "2004";

/**
 * Callback invoked when the run-time data must be persisted to the backend.
 *
 * It receives a snapshot (defensive copy) of the current data model. It is
 * called on an explicit `commit` and once more as part of a successful
 * `terminate`/`finish`. It is **never** called once the session has been
 * terminated.
 */
export type CommitHandler = (snapshot: Record<string, string>) => void;

/** Construction options for {@link ScormBridge}. */
export interface ScormBridgeOptions {
  /** Which SCORM standard the loaded package targets. Defaults to `"1.2"`. */
  version?: ScormVersion;
  /** Optional backend persistence effect. */
  onCommit?: CommitHandler;
}

/** Internal lifecycle states of a SCORM session. */
export type ScormLifecycleState =
  | "not_initialized"
  | "running"
  | "terminated";

/**
 * SCORM run-time error codes (shared between 1.2 and 2004 where they overlap).
 *
 * Only the codes the bridge actually emits are enumerated here; `0` means no
 * error. The "before initialization" / "after termination" pairs are what make
 * the lifecycle invariant (Property 12) observable to the package.
 */
export const ScormErrorCode = {
  NoError: 0,
  GeneralException: 101,
  AlreadyInitialized: 103,
  ContentInstanceTerminated: 104,
  TerminateBeforeInit: 112,
  TerminateAfterTermination: 113,
  GetBeforeInit: 122,
  GetAfterTermination: 123,
  SetBeforeInit: 132,
  SetAfterTermination: 133,
  CommitBeforeInit: 142,
  CommitAfterTermination: 143,
} as const;

export type ScormErrorCodeValue =
  (typeof ScormErrorCode)[keyof typeof ScormErrorCode];

/** Human-readable messages for the error codes the bridge emits. */
const ERROR_STRINGS: Record<number, string> = {
  [ScormErrorCode.NoError]: "No error",
  [ScormErrorCode.GeneralException]: "General exception",
  [ScormErrorCode.AlreadyInitialized]: "Already initialized",
  [ScormErrorCode.ContentInstanceTerminated]: "Content instance terminated",
  [ScormErrorCode.TerminateBeforeInit]: "Termination before initialization",
  [ScormErrorCode.TerminateAfterTermination]: "Termination after termination",
  [ScormErrorCode.GetBeforeInit]: "Retrieve data before initialization",
  [ScormErrorCode.GetAfterTermination]: "Retrieve data after termination",
  [ScormErrorCode.SetBeforeInit]: "Store data before initialization",
  [ScormErrorCode.SetAfterTermination]: "Store data after termination",
  [ScormErrorCode.CommitBeforeInit]: "Commit before initialization",
  [ScormErrorCode.CommitAfterTermination]: "Commit after termination",
};

const TRUE = "true";
const FALSE = "false";

/**
 * Pure SCORM run-time bridge.
 *
 * Holds an in-memory key/value data model plus the session lifecycle state and
 * the standard "last error" register. All boolean-returning operations are
 * rejected (returning `"false"` and setting an appropriate error code) unless
 * the session is in the `running` state, which guarantees the lifecycle
 * invariant: nothing can be read, written or committed before initialization
 * or after termination.
 */
export class ScormBridge {
  private readonly data = new Map<string, string>();
  private state: ScormLifecycleState = "not_initialized";
  private lastError: number = ScormErrorCode.NoError;
  private readonly onCommit?: CommitHandler;

  /** The SCORM standard this bridge speaks. */
  readonly version: ScormVersion;

  constructor(options: ScormBridgeOptions = {}) {
    this.version = options.version ?? "1.2";
    this.onCommit = options.onCommit;
  }

  /** Current lifecycle state. Useful for the UI and for tests. */
  get lifecycleState(): ScormLifecycleState {
    return this.state;
  }

  /** Whether the session is currently initialized and not yet terminated. */
  get isRunning(): boolean {
    return this.state === "running";
  }

  /** Whether the session has been finished/terminated. */
  get isTerminated(): boolean {
    return this.state === "terminated";
  }

  /** Defensive snapshot of the current data model. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.data);
  }

  // ---------------------------------------------------------------------------
  // Core lifecycle + data-model operations (standard-agnostic)
  // ---------------------------------------------------------------------------

  /**
   * Begin a SCORM session. Valid only from `not_initialized`.
   *
   * @returns `"true"` on success, `"false"` otherwise.
   */
  initialize(): string {
    if (this.state === "running") {
      return this.fail(ScormErrorCode.AlreadyInitialized);
    }
    if (this.state === "terminated") {
      return this.fail(ScormErrorCode.ContentInstanceTerminated);
    }
    this.state = "running";
    this.lastError = ScormErrorCode.NoError;
    return TRUE;
  }

  /**
   * Read a value from the data model.
   *
   * Returns the previously stored value unchanged (round-trip, Property 10), or
   * an empty string when the key has not been set. Outside the `running` state
   * it returns an empty string and sets the appropriate error code.
   */
  getValue(key: string): string {
    if (this.state !== "running") {
      this.lastError =
        this.state === "terminated"
          ? ScormErrorCode.GetAfterTermination
          : ScormErrorCode.GetBeforeInit;
      return "";
    }
    this.lastError = ScormErrorCode.NoError;
    return this.data.get(key) ?? "";
  }

  /**
   * Store a value in the data model.
   *
   * The value is stored verbatim so a subsequent {@link getValue} returns it
   * unchanged. Outside the `running` state it is rejected.
   *
   * @returns `"true"` on success, `"false"` otherwise.
   */
  setValue(key: string, value: string): string {
    if (this.state !== "running") {
      return this.fail(
        this.state === "terminated"
          ? ScormErrorCode.SetAfterTermination
          : ScormErrorCode.SetBeforeInit,
      );
    }
    this.data.set(key, value);
    this.lastError = ScormErrorCode.NoError;
    return TRUE;
  }

  /**
   * Persist the current data model via the injected `onCommit` effect.
   *
   * Outside the `running` state it is rejected and, crucially, the `onCommit`
   * callback is **not** invoked — so no backend commit is sent after the
   * session has been terminated (Property 12).
   *
   * @returns `"true"` on success, `"false"` otherwise.
   */
  commit(): string {
    if (this.state !== "running") {
      return this.fail(
        this.state === "terminated"
          ? ScormErrorCode.CommitAfterTermination
          : ScormErrorCode.CommitBeforeInit,
      );
    }
    this.onCommit?.(this.snapshot());
    this.lastError = ScormErrorCode.NoError;
    return TRUE;
  }

  /**
   * End the SCORM session, persisting the final state once.
   *
   * Valid only from `running`. A successful terminate performs a final commit
   * (invoking `onCommit`) and then moves to the `terminated` state, after which
   * all further operations are rejected without any backend commit.
   *
   * @returns `"true"` on success, `"false"` otherwise.
   */
  terminate(): string {
    if (this.state !== "running") {
      return this.fail(
        this.state === "terminated"
          ? ScormErrorCode.TerminateAfterTermination
          : ScormErrorCode.TerminateBeforeInit,
      );
    }
    // Final persist while still running, then close the session.
    this.onCommit?.(this.snapshot());
    this.state = "terminated";
    this.lastError = ScormErrorCode.NoError;
    return TRUE;
  }

  /** Last error code as a string, per the SCORM run-time spec. */
  getLastError(): string {
    return String(this.lastError);
  }

  /** Human-readable message for an error code (defaults to the last error). */
  getErrorString(code?: string): string {
    const numeric = code === undefined ? this.lastError : Number(code);
    return ERROR_STRINGS[numeric] ?? "";
  }

  /** Vendor diagnostic detail. We mirror the error string. */
  getDiagnostic(code?: string): string {
    return this.getErrorString(code);
  }

  /**
   * Set the error register and return `"false"`.
   *
   * Centralizes the "reject an operation" path used by the boolean-returning
   * methods.
   */
  private fail(code: number): string {
    this.lastError = code;
    return FALSE;
  }

  // ---------------------------------------------------------------------------
  // SCORM 1.2 named API surface
  // ---------------------------------------------------------------------------

  LMSInitialize(_param = ""): string {
    return this.initialize();
  }

  LMSGetValue(key: string): string {
    return this.getValue(key);
  }

  LMSSetValue(key: string, value: string): string {
    return this.setValue(key, value);
  }

  LMSCommit(_param = ""): string {
    return this.commit();
  }

  LMSFinish(_param = ""): string {
    return this.terminate();
  }

  LMSGetLastError(): string {
    return this.getLastError();
  }

  LMSGetErrorString(code?: string): string {
    return this.getErrorString(code);
  }

  LMSGetDiagnostic(code?: string): string {
    return this.getDiagnostic(code);
  }

  // ---------------------------------------------------------------------------
  // SCORM 2004 named API surface
  // ---------------------------------------------------------------------------

  Initialize(_param = ""): string {
    return this.initialize();
  }

  GetValue(key: string): string {
    return this.getValue(key);
  }

  SetValue(key: string, value: string): string {
    return this.setValue(key, value);
  }

  Commit(_param = ""): string {
    return this.commit();
  }

  Terminate(_param = ""): string {
    return this.terminate();
  }

  GetLastError(): string {
    return this.getLastError();
  }

  GetErrorString(code?: string): string {
    return this.getErrorString(code);
  }

  GetDiagnostic(code?: string): string {
    return this.getDiagnostic(code);
  }
}
