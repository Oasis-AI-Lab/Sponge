/** The default Move Up detector: a stub that judges nothing. @module @oasisailab/sponge-experimental-move-up-detector/stub-detector */

import { MoveUpDetectorId } from './brand.ts'
import type { MoveUpDetector, MoveUpDetectorResult } from './types.ts'

/** Registry key of the built-in stub detector. */
export const STUB_DETECTOR_ID = MoveUpDetectorId('stub')

/**
 * Built-in V0 default: always `stay`, with a reason naming the omission.
 *
 * It exists so that loading the plugin changes no judgment: an enabled detector
 * with no implementation must not pretend to decide. Replace it by registering
 * another detector and naming that id in `Config.detectors`.
 */
export const stubDetector: MoveUpDetector = {
  id: STUB_DETECTOR_ID,
  detect(): MoveUpDetectorResult {
    return { decision: 'stay', reason: 'stub detector: no Move Up judgment is implemented' }
  },
}
