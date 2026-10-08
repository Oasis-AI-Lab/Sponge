/** A built-in detector that exercises the `ask` outcome. @module @oasisailab/sponge-experimental-move-up-detector/human-review-detector */

import { MoveUpDetectorId } from './brand.ts'
import type { MoveUpDetector, MoveUpDetectorResult } from './types.ts'

/** Registry key of the built-in always-ask detector. */
export const HUMAN_REVIEW_DETECTOR_ID = MoveUpDetectorId('human-review')

/**
 * Built-in always-`ask` detector: every candidate defers to a person.
 *
 * It implements no judgment either. Its purpose is to prove the detector
 * boundary is replaceable from configuration alone — selecting this id changes
 * the observed decision distribution without touching the runtime, the session
 * log, or any other package.
 */
export const humanReviewDetector: MoveUpDetector = {
  id: HUMAN_REVIEW_DETECTOR_ID,
  detect(): MoveUpDetectorResult {
    return { decision: 'ask', reason: 'human review required for every candidate' }
  },
}
