/**
 * Shared bin dispatch for the `dsh` and `sponge` command lines. Dynamic
 * imports per mode keep unrelated modes out of each dispatch path; the
 * adapter prints and exits for `--help`/`--version`/a parse error, so only a
 * valid mode reaches the switch. Each bin entry (bin.ts, bin-sponge.ts) passes
 * its own invoked name, which drives the web alias's Portal default.
 * @module @oasisailab/sponge/dispatch
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadLayeredEnv } from '@oasisailab/sponge-app-boot'
import { parseDshArgs } from './args.ts'

// Both the source tree (apps/cli/src) and the bundled bins (apps/cli/lib) sit
// one directory under apps/cli, so the checked-in manifest resolves with the
// same relative hop from either artifact.
/** This app's version, read from its checked-in package.json. */
function readVersion(): string {
  const manifest = JSON.parse(
    readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
  ) as { version?: unknown }
  return typeof manifest.version === 'string' ? manifest.version : '0.0.0'
}

/**
 * Parse argv and run the resolved invocation.
 * @param argv - arguments after the Node binary and script.
 * @param commandName - the invoked command name; drives the web alias's Portal default.
 */
export async function runCli(argv: readonly string[], commandName: 'dsh' | 'sponge'): Promise<void> {
  const invocation = parseDshArgs(argv, readVersion(), commandName)

  switch (invocation.mode) {
    case 'profile': {
      const { runProfile } = await import('./profile-boot.ts')
      await runProfile({
        environment: loadLayeredEnv('dsh'),
        profile: invocation.profile,
        patchFiles: invocation.patches,
        args: invocation.args,
      })
      break
    }
    case 'plugin': {
      const { runPlugin } = await import('./plugin.ts')
      process.exit(runPlugin(invocation.profile, invocation.args))
      break
    }
    case 'dump-config': {
      const { runDumpConfig } = await import('./dump-config.ts')
      runDumpConfig(invocation.profile, invocation.defaultOnly, invocation.patches)
      break
    }
    default:
      invocation satisfies never
      throw new Error(`${commandName}: unhandled invocation mode ${JSON.stringify(invocation)}`)
  }
}
