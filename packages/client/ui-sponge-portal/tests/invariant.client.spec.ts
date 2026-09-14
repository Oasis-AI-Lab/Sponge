import { describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import * as PortalInvariant from '@oasisailab/sponge-client-ui-sponge-portal/invariant'
import InvariantRegistry from '@oasisailab/sponge-invariants'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(PortalInvariant).await()).resolves.toBeDefined()
  })

  it('node-half apply is a no-op host placeholder', async () => {
    const { apply } = await import('@oasisailab/sponge-client-ui-sponge-portal')
    apply()
    expect(true).toBe(true) // reaching here without throw is the contract
  })
})
