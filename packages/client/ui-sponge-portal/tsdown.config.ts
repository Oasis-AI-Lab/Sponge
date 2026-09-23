import { clientBundle } from '../tsdown.client.ts'

export default clientBundle('@oasisailab/sponge-client-ui-sponge-portal', ['lib/types/index.js', 'lib/types/invariant.js'], {
  // DSH_BUILD_VARIANT=upstream routes the client bundle through the Desktop
  // panel-seat entry (keyed `main` + route->panel bridge).
  variantEntry: 'src/client/index.upstream.ts',
})
