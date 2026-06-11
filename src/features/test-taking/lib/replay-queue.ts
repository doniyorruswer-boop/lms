/**
 * Pure, framework-agnostic replay queue for test answer autosave.
 *
 * When the browser connection drops mid-test (Req 7.7), unsaved answer drafts
 * are buffered in a `ReplayQueue`. Once the connection is restored the queue is
 * flushed back to the backend. The queue is isolated as a small, side-effect
 * free data structure (the only injected effect is the async sender passed to
 * `flush`) so it can be covered by property-based tests and consumed by the
 * Test_Module UI.
 *
 * See design.md "Property 15: Test javoblari replay queue invariant".
 * Requirements: 7.7 (re-send unsaved answers once the connection recovers).
 *
 * Invariants:
 * - Key-deduplication: answers are keyed by `questionId`; enqueuing the same
 *   question again replaces the buffered value with the latest one, so only the
 *   most recent answer per question is ever sent.
 * - Empties on success: a successful `flush` clears every entry that was sent.
 * - No re-send after success: once a key has been flushed successfully it is no
 *   longer in the queue, so it is not sent again unless it is re-enqueued.
 */

import type { AnswerDraft } from "../../../shared/types/assessment"

/**
 * Sends a batch of buffered answer drafts to the backend.
 *
 * Resolves when the batch was accepted; rejects when the send failed (e.g. the
 * connection is still unavailable), in which case the queue is preserved for a
 * later retry.
 */
export type AnswerSender = (answers: AnswerDraft[]) => Promise<void>

/** Returns `true` when two drafts carry the same answer payload. */
function draftsEqual(a: AnswerDraft, b: AnswerDraft): boolean {
  return (
    a.questionId === b.questionId &&
    a.selectedOptionId === b.selectedOptionId &&
    a.markedForReview === b.markedForReview
  )
}

/** Defensive copy so external mutation of a draft cannot affect the queue. */
function cloneDraft(answer: AnswerDraft): AnswerDraft {
  return {
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    markedForReview: answer.markedForReview,
  }
}

export class ReplayQueue {
  /** Latest pending draft per `questionId` (insertion-ordered). */
  private readonly pending = new Map<string, AnswerDraft>()

  /** Guards against overlapping flushes. */
  private flushing = false

  /** Number of distinct questions currently buffered. */
  get size(): number {
    return this.pending.size
  }

  /** Whether the queue currently has no buffered answers. */
  get isEmpty(): boolean {
    return this.pending.size === 0
  }

  /** Whether a draft for the given question is currently buffered. */
  has(questionId: string): boolean {
    return this.pending.has(questionId)
  }

  /**
   * Buffer (or replace) the latest answer for a question.
   *
   * Enqueuing the same `questionId` again overwrites the previously buffered
   * value with the most recent one, guaranteeing only the latest answer per
   * question is sent (key-deduplication).
   */
  enqueue(answer: AnswerDraft): void {
    this.pending.set(answer.questionId, cloneDraft(answer))
  }

  /**
   * Snapshot of the currently buffered drafts, ordered by first enqueue.
   *
   * Returns defensive copies so callers cannot mutate the internal state.
   */
  peek(): AnswerDraft[] {
    return Array.from(this.pending.values(), cloneDraft)
  }

  /**
   * Attempt to send every buffered draft via `send`.
   *
   * On success the sent entries are removed from the queue. Entries that were
   * re-enqueued with a new value while the send was in flight are preserved, so
   * a later answer is never lost. On failure the queue is left untouched so the
   * caller can retry once the connection recovers.
   *
   * An empty queue is a no-op success. Overlapping flushes are rejected (the
   * second call returns `false`) to keep send ordering well-defined.
   *
   * @returns `true` when the batch was sent (or there was nothing to send),
   *          `false` when the send failed or a flush was already in progress.
   */
  async flush(send: AnswerSender): Promise<boolean> {
    if (this.pending.size === 0) return true
    if (this.flushing) return false

    this.flushing = true
    const snapshot = new Map(this.pending)

    try {
      await send(Array.from(snapshot.values(), cloneDraft))

      // Remove only the entries that were actually sent and have not been
      // superseded by a newer value during the send.
      for (const [questionId, sent] of snapshot) {
        const current = this.pending.get(questionId)
        if (current && draftsEqual(current, sent)) {
          this.pending.delete(questionId)
        }
      }
      return true
    } catch {
      return false
    } finally {
      this.flushing = false
    }
  }

  /** Drop all buffered answers without sending them. */
  clear(): void {
    this.pending.clear()
  }
}
