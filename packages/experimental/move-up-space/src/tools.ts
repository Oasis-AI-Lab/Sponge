/**
 * Model-facing recall over the Space object store. `space_recall` is the
 * closed loop's Recall segment: a tool call whose arguments, result, and
 * description all enter the session log, so recalling an object needs no new
 * session event. `space_list` is the developer's read-only inspection window.
 *
 * Both tools resolve the calling agent's Space from its session `cwd`, the same
 * workspace-root namespace the promotion bridge writes under, so a recall sees
 * exactly the objects that session's promotions created.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/tools
 */

import { defineTool } from '@oasisailab/sponge-tools'
import type { ToolDefinition, ToolRunContext } from '@oasisailab/sponge-tools'
import { spaceIdForCwd } from './space.ts'
import type { SpaceId } from './brand.ts'
import type { SpaceObjectStore } from './store.ts'
import type { SpaceObject } from './types.ts'

/** One object as the model sees it: no internal origin, no Space id. */
interface RecalledObject {
  readonly id: string
  readonly kind: string
  readonly title: string
  readonly body: string
  readonly status: string
  readonly updatedAt: number
}

/** Project one stored object onto the model-facing fields. */
function recalled(object: SpaceObject): RecalledObject {
  return {
    id: object.id,
    kind: object.kind,
    title: object.title,
    body: object.body,
    status: object.status,
    updatedAt: object.updatedAt,
  }
}

/**
 * Resolve the calling agent's Space, or reject a caller with no owning session.
 * The Space namespace is derived the same way the bridge derives it, so recall
 * and promotion never disagree about which workspace owns an object.
 * @param exec - the running tool call.
 * @returns the calling session's Space id.
 */
function spaceOf(exec: ToolRunContext): SpaceId {
  const session = exec.agent?.session
  if (session === undefined) {
    throw new Error('space_recall and space_list require an owning agent session')
  }
  return spaceIdForCwd(session.header.cwd)
}

/** The wire object every recall result carries, shared by both tools' output schemas. */
const OBJECT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    kind: { type: 'string', required: true },
    title: { type: 'string', required: true },
    body: { type: 'string', required: true },
    status: { type: 'string', required: true },
    updatedAt: { type: 'integer', required: true },
  },
} as const

/** Render one recalled object as a compact line a reader can act on. */
function renderLine(object: RecalledObject): string {
  return `- [${object.kind}] ${object.title} (status: ${object.status})`
}

/** Compose the shared model-facing result text for a set of recalled objects. */
function renderObjects(objects: readonly RecalledObject[]): string {
  if (objects.length === 0) return 'No Space objects matched.'
  return `Space objects:\n${objects.map(renderLine).join('\n')}`
}

/**
 * Build the `space_recall` tool over one store.
 * @param store - the Space object store promotions write to.
 * @param maxRecalled - deployment bound on the objects one call returns.
 * @returns the registry-ready tool definition.
 */
export function spaceRecallTool(store: SpaceObjectStore, maxRecalled: number): ToolDefinition {
  return defineTool({
    name: 'space_recall',
    description:
      'Recall objects previously promoted out of conversation into this workspace\'s Space. '
      + 'Call it before re-asking the user for something the workspace may already hold — a '
      + 'hypothesis, a decision, or another promoted note. Optionally narrow by `query` '
      + '(case-insensitive substring of the title or body) and `kind`. Returns each matching '
      + 'object with its current status.',
    parameters: {
      query: {
        type: 'string',
        description: 'Case-insensitive substring to match against an object\'s title or body.',
      },
      kind: {
        type: 'string',
        description: 'Restrict to one object kind, e.g. `hypothesis` or `decision`.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          objects: { type: 'array', required: true, items: OBJECT_OUTPUT_SCHEMA },
        },
      },
      render: (_args, value) => [{ type: 'text', text: renderObjects(value.objects) }],
    },
    execute(args, exec) {
      const objects = filterObjects(store.list(spaceOf(exec)), args.query, args.kind).slice(0, maxRecalled)
      return Promise.resolve({ objects: objects.map(recalled) })
    },
    presentCall: args => ({
      card: 'generic',
      title: 'Recall Space objects',
      kind: 'search',
      rawInput: args,
    }),
  })
}

/**
 * Build the read-only `space_list` tool over one store: the developer's
 * inspection window over the calling session's Space.
 * @param store - the Space object store promotions write to.
 * @returns the registry-ready tool definition.
 */
export function spaceListTool(store: SpaceObjectStore): ToolDefinition {
  return defineTool({
    name: 'space_list',
    description:
      'List every object currently in this workspace\'s Space, most recently updated first. '
      + 'A read-only inspection of what has been promoted; use `space_recall` to search instead.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          objects: { type: 'array', required: true, items: OBJECT_OUTPUT_SCHEMA },
        },
      },
      render: (_args, value) => [{ type: 'text', text: renderObjects(value.objects) }],
    },
    execute(_args, exec) {
      return Promise.resolve({ objects: store.list(spaceOf(exec)).map(recalled) })
    },
    presentCall: () => ({ card: 'generic', title: 'List Space objects', kind: 'read' }),
  })
}

/** Apply the optional `query` and `kind` filters the recall tool declares. */
function filterObjects(
  objects: readonly SpaceObject[],
  query: string | undefined,
  kind: string | undefined,
): readonly SpaceObject[] {
  const needle = query?.trim().toLowerCase()
  return objects.filter((object) => {
    if (kind !== undefined && object.kind !== kind) return false
    if (needle === undefined || needle.length === 0) return true
    return object.title.toLowerCase().includes(needle) || object.body.toLowerCase().includes(needle)
  })
}
