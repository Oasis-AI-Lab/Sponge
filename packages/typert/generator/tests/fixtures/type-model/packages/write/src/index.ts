import { Service } from '@oasisailab/sponge-cordis'

/** Service whose public annotations are intentionally absent. */
export class WritableService extends Service {
  value = 1

  echo(input = 'value') {
    return input
  }
}

declare module '@oasisailab/sponge-cordis' {
  interface Context {
    writable: WritableService
  }
}

export default WritableService
