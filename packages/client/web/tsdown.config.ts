import { staticLinked } from '../tsdown.client.ts'

export default staticLinked(
  '@oasisailab/sponge-client-web',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
