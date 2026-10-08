/** Shared helpers for the Move Up detector suites. */

import { createUserMessage } from '@oasisailab/sponge-llm'
import type { UserMessage } from '@oasisailab/sponge-llm'

/** One human prompt, as the conversation log records it. */
export function humanMessage(text: string): UserMessage {
  return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
}

/**
 * Wait until a predicate holds, yielding the event loop between attempts.
 *
 * A judgment may be asynchronous, so a live-observation assertion has to wait
 * for the runtime's serialized chain rather than for a fixed number of
 * microtasks.
 *
 * @param predicate - condition that becomes true once the runtime settles.
 * @param label - subject named in the timeout failure.
 */
export async function until(predicate: () => boolean, label: string): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error(`timed out waiting for ${label}`)
}
