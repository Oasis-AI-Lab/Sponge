/**
 * The experimental harness: feed fixed candidate chunks to a Move Up detector
 * subject and read back one observation per judgment.
 *
 * It exists so detector implementations can be compared without a live
 * conversation, and it deliberately depends on nothing but the subject's
 * `observe` method — the runtime satisfies it, and so does any stand-in a later
 * experiment writes. It produces observations only; it creates nothing.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector/harness
 */

import { SessionId } from '@oasisailab/sponge-session'
import { MOVE_UP_CORPUS } from './corpus.ts'
import type { CorpusEntry } from './corpus.ts'
import type { MoveUpDetectorContext, MoveUpObservation, SemanticChunk } from './types.ts'

/** Session id reported as the origin of harness-fed chunks. */
const HARNESS_SESSION_ID = SessionId('move-up-detector-harness')

/**
 * The harness's only dependency: something that judges a chunk and returns what
 * each detector decided. `MoveUpDetectorRuntime` implements it.
 */
export interface HarnessSubject {
  /**
   * Judge one chunk and record the observations.
   * @param chunk - candidate unit to judge.
   * @param context - recent conversation and Space context.
   * @returns one observation per detector that ran.
   */
  observe(chunk: SemanticChunk, context?: MoveUpDetectorContext): Promise<readonly MoveUpObservation[]>
}

/** One corpus entry's outcome, as read back from the subject. */
export interface HarnessReport {
  /** Label of the corpus entry that produced {@link chunk}. */
  readonly label: string
  /** The chunk the harness fed, exactly as the subject received it. */
  readonly chunk: SemanticChunk
  /** One observation per detector that ran on this entry. */
  readonly observations: readonly MoveUpObservation[]
}

/**
 * Feed every corpus entry to one subject, in corpus order.
 *
 * Entries are judged sequentially so a report reads in conversation order and a
 * slow asynchronous detector cannot reorder it.
 *
 * @param subject - the detector runtime, or any object with the same `observe`.
 * @param entries - corpus entries to feed; defaults to {@link MOVE_UP_CORPUS}.
 * @returns one report per entry, in entry order.
 */
export async function runDetectorHarness(
  subject: HarnessSubject,
  entries: readonly CorpusEntry[] = MOVE_UP_CORPUS,
): Promise<readonly HarnessReport[]> {
  const reports: HarnessReport[] = []
  for (const [index, entry] of entries.entries()) {
    const chunk: SemanticChunk = {
      text: entry.text,
      origin: { sessionId: HARNESS_SESSION_ID, eventSeq: index, role: 'user' },
    }
    const context: MoveUpDetectorContext = {
      recentEvents: [],
      spaceObjects: entry.spaceObjects ?? [],
    }
    reports.push({ label: entry.label, chunk, observations: await subject.observe(chunk, context) })
  }
  return reports
}

/**
 * Render a harness report as one line-oriented text block.
 *
 * Observation timestamps are omitted so two runs of the same corpus diff
 * cleanly; a missing detector result prints as an explicit line rather than
 * disappearing, because "nothing ran" is itself the observation a developer
 * needs to see when a detector id is misconfigured.
 *
 * @param reports - reports returned by {@link runDetectorHarness}.
 * @returns the rendered report, ending without a trailing newline.
 */
export function formatHarnessReport(reports: readonly HarnessReport[]): string {
  const lines: string[] = [`move-up-detector harness — ${reports.length} entries`]
  for (const [index, report] of reports.entries()) {
    lines.push(`\n[${index + 1}] ${report.label}`)
    lines.push(`    chunk: ${report.chunk.text}`)
    if (report.observations.length === 0) {
      lines.push('    (no detector ran: check Config.detectors against the registered ids)')
      continue
    }
    for (const observation of report.observations) {
      const target = observation.result.existingObject === undefined
        ? ''
        : ` -> ${observation.result.existingObject}`
      const confidence = observation.result.confidence === undefined
        ? ''
        : ` (confidence ${observation.result.confidence})`
      lines.push(`    ${observation.detector.padEnd(14)}${observation.result.decision}${target}${confidence}`)
      lines.push(`      ${observation.result.reason}`)
    }
  }
  return lines.join('\n')
}
