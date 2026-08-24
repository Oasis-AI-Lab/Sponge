import { describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import InvariantRegistry from '@oasisailab/sponge-invariants'
import * as UserIdInvariant from '@oasisailab/sponge-anonymous-user-id/invariant'

describe('invariant companion', () => {
  it('registers the package ownership with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(UserIdInvariant).await()).resolves.toBeDefined()
  })
})
