import { clientLibrary } from '../../client/tsdown.client.ts'

export default clientLibrary(
  '@oasisailab/sponge-client-test-runtime',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
