/**
 * Property-based test for replay queue logic.
 *
 * **Validates: Requirements 7.7**
 * Property 15: Test javoblari replay queue invariant
 */

import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { ReplayQueue, type AnswerSender } from './replay-queue';
import type { AnswerDraft } from '../../../shared/types/assessment';

// Generators for test data
const arbAnswerDraft = fc.record({
  questionId: fc.string({ minLength: 1, maxLength: 20 }),
  selectedOptionId: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
  markedForReview: fc.boolean(),
});

const arbAnswerDrafts = fc.array(arbAnswerDraft, { minLength: 0, maxLength: 10 });

describe('ReplayQueue', () => {
  it('Property 15: Test javoblari replay queue invariant', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialAnswers: arbAnswerDrafts,
          subsequentAnswers: arbAnswerDrafts,
          shouldSucceed: fc.boolean(),
        }),
        async ({ initialAnswers, subsequentAnswers, shouldSucceed }) => {
          const queue = new ReplayQueue();
          const mockSender: AnswerSender = vi.fn().mockImplementation(async (answers) => {
            if (!shouldSucceed) {
              throw new Error('Network failure');
            }
            // Simulate successful send
            return Promise.resolve();
          });

          // Enqueue initial answers
          for (const answer of initialAnswers) {
            queue.enqueue(answer);
          }

          const sizeBeforeFlush = queue.size;
          
          // Key-deduplication invariant: only one entry per questionId
          const uniqueQuestionIds = new Set(initialAnswers.map(a => a.questionId));
          expect(queue.size).toBe(uniqueQuestionIds.size);

          // Test flush behavior
          const flushResult = await queue.flush(mockSender);

          if (shouldSucceed && sizeBeforeFlush > 0) {
            expect(flushResult).toBe(true);
            expect(mockSender).toHaveBeenCalledTimes(1);
            
            // Empties on success invariant: successful flush should clear sent entries
            if (subsequentAnswers.length === 0) {
              // If no concurrent updates, queue should be empty
              expect(queue.isEmpty).toBe(true);
            }
          } else if (!shouldSucceed && sizeBeforeFlush > 0) {
            expect(flushResult).toBe(false);
            // Failed flush should preserve the queue
            expect(queue.size).toBe(sizeBeforeFlush);
          }

          // Enqueue subsequent answers during/after flush
          for (const answer of subsequentAnswers) {
            queue.enqueue(answer);
          }

          // No re-send after success invariant: items successfully sent should not be sent again
          // unless they were re-enqueued with new values
          if (shouldSucceed && subsequentAnswers.length === 0) {
            const secondFlush = await queue.flush(mockSender);
            expect(secondFlush).toBe(true);
            expect(queue.isEmpty).toBe(true);
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('maintains key-deduplication invariant', () => {
    fc.assert(
      fc.property(
        fc.array(arbAnswerDraft, { minLength: 1, maxLength: 20 }),
        (answers) => {
          const queue = new ReplayQueue();
          
          // Enqueue all answers
          for (const answer of answers) {
            queue.enqueue(answer);
          }

          // Queue size should equal unique question IDs
          const uniqueQuestionIds = new Set(answers.map(a => a.questionId));
          expect(queue.size).toBe(uniqueQuestionIds.size);

          // Peek should return the latest answer for each question
          const peeked = queue.peek();
          const peekedByQuestion = new Map(peeked.map(a => [a.questionId, a]));

          // For each unique question, the peeked answer should be the last one enqueued
          for (const questionId of uniqueQuestionIds) {
            const lastAnswerForQuestion = answers
              .filter(a => a.questionId === questionId)
              .at(-1);
            const peekedAnswer = peekedByQuestion.get(questionId);
            
            expect(peekedAnswer).toBeDefined();
            expect(peekedAnswer?.selectedOptionId).toBe(lastAnswerForQuestion?.selectedOptionId);
            expect(peekedAnswer?.markedForReview).toBe(lastAnswerForQuestion?.markedForReview);
          }
        },
      ),
      { numRuns: 100 }
    );
  });

  it('handles concurrent enqueue during flush correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialAnswer: arbAnswerDraft,
          updatedAnswer: arbAnswerDraft.filter(draft => draft.questionId === fc.constant('same')),
        }),
        async ({ initialAnswer, updatedAnswer }) => {
          // Force same question ID for testing concurrent updates
          const sameQuestionId = 'test-question';
          const initial = { ...initialAnswer, questionId: sameQuestionId };
          const updated = { ...updatedAnswer, questionId: sameQuestionId };

          const queue = new ReplayQueue();
          let sendCalled = false;
          
          const slowSender: AnswerSender = vi.fn().mockImplementation(async (answers) => {
            sendCalled = true;
            // Enqueue updated answer during send
            queue.enqueue(updated);
            return Promise.resolve();
          });

          queue.enqueue(initial);
          expect(queue.size).toBe(1);

          const flushResult = await queue.flush(slowSender);
          expect(flushResult).toBe(true);
          expect(sendCalled).toBe(true);

          // Queue should contain the updated answer, not be empty
          if (initial.selectedOptionId !== updated.selectedOptionId || 
              initial.markedForReview !== updated.markedForReview) {
            expect(queue.size).toBe(1);
            const peeked = queue.peek();
            expect(peeked[0]?.selectedOptionId).toBe(updated.selectedOptionId);
            expect(peeked[0]?.markedForReview).toBe(updated.markedForReview);
          }
        },
      ),
      { numRuns: 50 }
    );
  });

  it('prevents overlapping flushes', () => {
    fc.assert(
      fc.property(
        arbAnswerDraft,
        async (answer) => {
          const queue = new ReplayQueue();
          queue.enqueue(answer);

          let firstSendStarted = false;
          let secondSendStarted = false;

          const slowSender: AnswerSender = vi.fn().mockImplementation(async () => {
            if (!firstSendStarted) {
              firstSendStarted = true;
              // Simulate slow network
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            return Promise.resolve();
          });

          const fastSender: AnswerSender = vi.fn().mockImplementation(async () => {
            secondSendStarted = true;
            return Promise.resolve();
          });

          // Start first flush (slow)
          const firstFlushPromise = queue.flush(slowSender);
          
          // Immediately try second flush (should be rejected)
          const secondFlushResult = await queue.flush(fastSender);
          
          // Second flush should be rejected
          expect(secondFlushResult).toBe(false);
          expect(secondSendStarted).toBe(false);

          // Wait for first flush to complete
          const firstFlushResult = await firstFlushPromise;
          expect(firstFlushResult).toBe(true);
          expect(firstSendStarted).toBe(true);
        },
      ),
      { numRuns: 50 }
    );
  });
});