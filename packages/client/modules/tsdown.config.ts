import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@oasisailab/sponge-client-modules',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
