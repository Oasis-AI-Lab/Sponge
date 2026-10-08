/**
 * The fixed V0 observation corpus.
 *
 * These entries are the experiment's input, not test fixtures: they are the
 * conversation shapes a real detector is expected to separate, drawn from the
 * Move Up concept record's examples. A detector that is replaced is compared
 * against this same corpus, so the entries deliberately include the cases that
 * look important but should stay in the conversation, the cases that look like
 * independent objects, and one that may belong to an object that already exists.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector/corpus
 */

/** One corpus entry fed to the runtime by the experimental harness. */
export interface CorpusEntry {
  /** Short label identifying the entry in a harness report. */
  readonly label: string
  /** Candidate chunk text, judged as if it had been said in conversation. */
  readonly text: string
  /** Existing Space object identifiers visible to this entry's judgment. */
  readonly spaceObjects?: readonly string[]
}

/** V0 corpus entries, ordered as a conversation would present them. */
export const MOVE_UP_CORPUS: readonly CorpusEntry[] = [
  {
    label: 'reaction',
    text: '这个想法挺有意思。',
  },
  {
    label: 'hypothesis',
    text: 'NPC 的独立性可能影响玩家对角色真实性的感知。',
  },
  {
    label: 'experiment-proposal',
    text: '那我们就做一个 A/B 实验验证它。',
  },
  {
    label: 'existing-experiment',
    text: '那就测试 NPC independence。',
    spaceObjects: ['Experiment E17'],
  },
  {
    label: 'operational-aside',
    text: '对，你先看一下 build 有没有过。',
  },
  {
    label: 'closing',
    text: '今天先聊到这儿。',
  },
]
