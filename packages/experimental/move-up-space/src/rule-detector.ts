/**
 * The MVP's rule-based Move Up detector: a keyword classifier that turns a
 * conversation chunk into `move-up`, `ask`, or `stay`. It implements the
 * detector seam; it writes nothing.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/rule-detector
 */

import { MoveUpDetectorId } from '@oasisailab/sponge-experimental-move-up-detector'
import type { MoveUpDetector, MoveUpDetectorResult } from '@oasisailab/sponge-experimental-move-up-detector'

/** Registry key of the MVP rule detector. */
export const RULE_DETECTOR_ID = MoveUpDetectorId('rule')

/** Markers of a committed decision: the speaker settled on something. */
const DECISION_COMMIT_MARKERS: readonly string[] = [
  '决定', '就这么', '定为', '采用', '敲定', '承诺', '就选', '确定用', '拍板',
  'decided', "we'll use", 'we will use', "let's use", 'go with', 'commit to', 'settled on',
]

/** Markers of a decision still forming: the speaker leans a way but has not committed. */
const DECISION_TENTATIVE_MARKERS: readonly string[] = [
  '打算', '倾向于', '计划用', '考虑用', '想用', '准备用',
  'propose', 'proposing', 'plan to', 'lean toward', 'consider using',
]

/** Markers of a hypothesis: a claim offered for testing, not a choice. */
const HYPOTHESIS_MARKERS: readonly string[] = [
  '假设', '可能', '也许', '或许', '大概', '我猜', '会不会', '说不定', '似乎', '推测',
  'hypothesis', 'hypothesize', 'maybe', 'perhaps', 'possibly', 'might be', 'we suspect',
]

/** Markers of a candidate the MVP defers to the user instead of judging. */
const ASK_MARKERS: readonly string[] = [
  '要不要', '是否', '该不该', '需不需要',
  'should we', 'whether we', 'do we want', '?', '？',
]

/** One classification outcome. `kind` and `status` are absent only for `stay`. */
export type RuleClassification =
  | { readonly decision: 'stay'; readonly reason: string }
  | { readonly decision: 'ask'; readonly kind: string; readonly status: string; readonly reason: string }
  | { readonly decision: 'move-up'; readonly kind: string; readonly status: string; readonly reason: string }

/** The first marker that occurs, for a reason line that names the trigger. */
function matched(text: string, markers: readonly string[]): string | undefined {
  const lowered = text.toLowerCase()
  return markers.find(marker => lowered.includes(marker))
}

/**
 * Classify one chunk by keyword. Decision markers win over hypothesis markers,
 * then hypothesis markers win over ask markers; a chunk matching none stays in
 * the conversation.
 *
 * This is a placeholder for a real judgment (the concept record's open question
 * R2); it exists to exercise the closed loop, not to be accurate.
 *
 * @param text - the chunk text.
 * @returns the classification, with kind and status for a non-`stay` outcome.
 */
export function classify(text: string): RuleClassification {
  const committed = matched(text, DECISION_COMMIT_MARKERS)
  if (committed !== undefined) {
    return { decision: 'move-up', kind: 'decision', status: 'accepted', reason: `committed decision (matched "${committed}")` }
  }
  const tentative = matched(text, DECISION_TENTATIVE_MARKERS)
  if (tentative !== undefined) {
    return { decision: 'move-up', kind: 'decision', status: 'proposed', reason: `tentative decision (matched "${tentative}")` }
  }
  const hypothesis = matched(text, HYPOTHESIS_MARKERS)
  if (hypothesis !== undefined) {
    return { decision: 'move-up', kind: 'hypothesis', status: 'open', reason: `hypothesis (matched "${hypothesis}")` }
  }
  const ask = matched(text, ASK_MARKERS)
  if (ask !== undefined) {
    return { decision: 'ask', kind: 'hypothesis', status: 'open', reason: `open question deferred to the user (matched "${ask}")` }
  }
  return { decision: 'stay', reason: 'no Move Up signal' }
}

/**
 * The MVP rule detector. It reports the classification's decision; kind and
 * status are read by the promotion bridge from {@link classify}, because the
 * detector result vocabulary carries no kind.
 */
export const ruleDetector: MoveUpDetector = {
  id: RULE_DETECTOR_ID,
  detect(chunk): MoveUpDetectorResult {
    const classification = classify(chunk.text)
    return { decision: classification.decision, reason: classification.reason }
  },
}
