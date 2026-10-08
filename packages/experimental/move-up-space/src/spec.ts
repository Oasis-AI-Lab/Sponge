/**
 * Durable storage-domain declaration for promoted Space objects. The zod schema
 * is the durable-boundary validator and the single source of the record's
 * accepted values.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/spec
 */

import { z } from 'zod'
import { SessionId } from '@oasisailab/sponge-session'
import { defineDomain, domainTable } from '@oasisailab/sponge-storage-domain'
import { SpaceId, SpaceObjectId } from './brand.ts'
import type { SpaceObject } from './types.ts'

const nonNegativeSafeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

/** Runtime schema for one stored object origin. */
export const spaceObjectOriginSchema = z.object({
  sessionId: z.string().min(1).transform(value => SessionId(value)),
  eventSeq: nonNegativeSafeInteger,
  at: nonNegativeSafeInteger,
})

/**
 * Runtime schema for one promoted Space object. Branded ids are created at the
 * durable boundary because branding has no runtime representation, so the parsed
 * output is the public interface.
 */
export const spaceObjectSchema = z.object({
  id: z.string().min(1).transform(value => SpaceObjectId(value)),
  spaceId: z.string().min(1).transform(value => SpaceId(value)),
  kind: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  status: z.string().min(1),
  origin: spaceObjectOriginSchema,
  updatedAt: nonNegativeSafeInteger,
}) as unknown as z.ZodType<SpaceObject>

/**
 * The Space domain spec: one `objects` table keyed by object id. The record
 * carries its `spaceId`, so one medium holds every workspace namespace and reads
 * filter by that field instead of by file.
 */
export const spaceDomainSpec = defineDomain({
  name: 'space',
  version: 0,
  tables: { objects: domainTable<SpaceObject['id'], SpaceObject>(spaceObjectSchema) },
})
