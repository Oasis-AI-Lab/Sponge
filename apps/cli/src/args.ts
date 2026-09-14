/**
 * Commander adapter for the `dsh` / `sponge` command line.
 *
 * The launcher parses only what it owns — which profile to boot, which extra
 * patch overlays to apply, and the config dumps — and hands **everything after
 * its own flags** to the booted tree verbatim, where injected app plugins parse
 * their own flag families and print their own `--help` (see
 * `@oasisailab/sponge-cmdline`). Launcher flags therefore come first: the first
 * token this parser does not recognize starts the inner arguments, so
 * `sponge --profile tui --resume abc` boots the tui profile with `--resume abc`,
 * and `sponge --profile web -h` prints the web app's help, not this one's.
 *
 * Both bins share this parser: `sponge` is the Sponge-brand command (the web
 * alias forwards `--portal` so the browser boots into the Portal surface),
 * while `dsh` keeps the legacy conversation-first web boot.
 *
 * `web` is a hardcoded alias for `--profile web`; `editor` is reserved for the
 * future Editor surface and fails loud until it exists; `plugin` manages a
 * profile's plugin dependencies by forwarding to pnpm.
 * @module @oasisailab/sponge/args
 */

import { Command, CommanderError } from 'commander'

/** Boot a named profile and hand it the invocation's inner arguments. */
interface ProfileInvocation {
  mode: 'profile'
  profile: string
  /** Extra patch-list overlays applied after the profile's own layer, in argv order. */
  patches: string[]
  /** Everything after the launcher's own flags, verbatim, for injected app plugins. */
  args: string[]
}

/** Print a composed profile tree and exit without booting. */
interface DumpConfigInvocation {
  mode: 'dump-config'
  profile: string
  /** Omit the profile's user layer and --patch overlays; print bundle layers only. */
  defaultOnly: boolean
  patches: string[]
}

/** Manage a profile's plugins: forward `args` to pnpm inside the profile directory. */
interface PluginInvocation {
  mode: 'plugin'
  profile: string
  /** Raw pnpm arguments, verbatim. */
  args: string[]
}

/** The resolved invocation. Help, version, and errors exit inside {@link parseDshArgs}. */
export type DshInvocation = ProfileInvocation | DumpConfigInvocation | PluginInvocation

/** Launcher flags shared by the default command and the `web` alias. */
interface BootOptions {
  patch?: string[]
  dumpConfig?: boolean
  dumpDefaultConfig?: boolean
}

/**
 * Repeatable single-value collector: `--patch a.yml --patch b.yml`. Never
 * variadic — a variadic `--patch` would swallow the inner arguments.
 */
const collect = (value: string, previous: string[] = []): string[] => [...previous, value]

/** The launcher's own help text; each app prints its own. */
const HELP_EXAMPLES = (commandName: string) => `
Examples:
  ${commandName} --profile web                          boot the web profile (same as: ${commandName} web)
  ${commandName} web                                    boot into the Sponge Portal surface (sponge only)
  ${commandName} web --history                          open the web UI on the session history list
  ${commandName} web --resume <session>                 resume a specific session
  ${commandName} --profile headless "run the tests"     answer one task, print the result, and exit
  ${commandName} --profile tui --patch ./extra.yml      boot a custom profile with one extra overlay
  ${commandName} --profile tui --resume <session>       arguments after the launcher flags reach the app
  ${commandName} --profile web --help                   the web app's own flags and help
  ${commandName} plugin --profile tui add <package>     install a plugin into the tui profile
`

/**
 * Resolve a boot or dump invocation from the launcher flags and the leftover
 * inner arguments.
 * @param program - the command whose options were parsed (the root, or the `web` alias).
 * @param profile - the profile these flags boot.
 * @param options - the launcher flags commander collected.
 * @param args - the leftover arguments, in argv order.
 * @returns the resolved invocation.
 */
function resolveBoot(program: Command, profile: string, options: BootOptions, args: string[]): DshInvocation {
  const patches = options.patch ?? []
  if (patches.includes('')) program.error('error: --patch needs a path')
  if (options.dumpConfig !== true && options.dumpDefaultConfig !== true) {
    return { mode: 'profile', profile, patches, args }
  }
  if (options.dumpConfig === true && options.dumpDefaultConfig === true) {
    program.error('error: --dump-config and --dump-default-config are mutually exclusive')
  }
  // The dump is boot-free: it never runs app command-line providers, so it
  // cannot show what those flags would decide, and printing a tree that differs
  // from the same invocation's boot would mislead.
  if (args.length > 0) {
    program.error(`error: config dumps take no app arguments, got ${args.map(argument => JSON.stringify(argument)).join(' ')}`)
  }
  const defaultOnly = options.dumpDefaultConfig === true
  if (defaultOnly && patches.length > 0) {
    program.error('error: --dump-default-config prints the bundle layers and takes no --patch')
  }
  return { mode: 'dump-config', profile, defaultOnly, patches }
}

/**
 * Resolve argv into one invocation, or print and exit for help, version, or an
 * error.
 * @param argv - arguments after the Node binary and script.
 * @param version - version string printed by `--version`.
 * @param commandName - the invoked command name ('dsh' or 'sponge'); drives the
 * help text and the web alias's Portal default.
 * @returns the resolved invocation.
 */
export function parseDshArgs(argv: readonly string[], version: string, commandName: 'dsh' | 'sponge' = 'dsh'): DshInvocation {
  let resolved: DshInvocation | undefined
  // Annotated, not inferred: the actions below call back into `program`, and an
  // inferred type would be circular through its own chain.
  const program: Command = new Command()
  program
    .name(commandName)
    .version(version, '-V, --version', 'output the version number')
    .description(`${commandName}: boot a Sponge profile — an ordered stack of plugin-bundle patch layers under your own overrides.`)
    .addHelpText('after', HELP_EXAMPLES(commandName))
    .exitOverride()
    // The launcher's flags come first and end at the first token it does not
    // know; everything from there on belongs to the booted app, including
    // its -h. `sponge -h` with no profile still prints this help, below.
    .helpOption(false)
    .allowUnknownOption()
    .passThroughOptions()
    .enablePositionalOptions()
    .argument('[args...]', `arguments for the booted profile's app (see: ${commandName} --profile <name> --help)`)
    .option('--profile <name>', 'the profile under $DSH_HOME/profiles to boot')
    .option('--patch <path>', 'extra patch-list overlay applied after the profile layer (repeatable)', collect)
    .option('--dump-config', 'print the composed profile tree and exit')
    .option('--dump-default-config', 'print the profile tree without its user layer or --patch overlays and exit')
    .action((args: string[], options: BootOptions & { profile?: string }) => {
      // With the app owning -h, the launcher's own help is what a bare
      // `${commandName} -h` (no profile to hand it to) must print.
      if (options.profile === undefined) {
        if (args.some(argument => argument === '-h' || argument === '--help')) program.help()
        program.error('error: --profile <name> is required')
      }
      const profile = options.profile
      if (profile === '') program.error('error: --profile needs a name')
      resolved = resolveBoot(program, profile, options, args)
    })

  /** Reject parent options supplied before a subcommand. */
  const rejectParentOptions = (subcommand: string): void => {
    const parent = program.opts<BootOptions & { profile?: string }>()
    if (parent.profile !== undefined || parent.patch !== undefined
      || parent.dumpConfig !== undefined || parent.dumpDefaultConfig !== undefined) {
      program.error(`error: ${subcommand} takes none of parent --profile, --patch, --dump-config, or --dump-default-config`)
    }
  }

  const web = program.command('web').description('boot the web profile (alias of --profile web); the web app\'s own flags follow')
  web
    .helpOption(false)
    .allowUnknownOption()
    .passThroughOptions()
    .enablePositionalOptions()
    .argument('[args...]', `arguments for the web app (see: ${commandName} web --help)`)
    .option('--patch <path>', 'extra patch-list overlay applied after the profile layer (repeatable)', collect)
    .option('--dump-config', 'print the composed web-profile tree (with the user layer and any --patch) and exit')
    .option('--dump-default-config', 'print the web profile\'s bundle layers (no user layer) and exit')
    .action((args: string[], options: BootOptions) => {
      rejectParentOptions('web')
      // The Sponge-brand command defaults the Portal surface on: the forwarded
      // flag tells the web app to open the browser into the Portal page. The
      // dsh alias keeps the legacy conversation-first boot untouched. Config
      // dumps stay clean — injecting a flag would make the dump reject its own
      // arguments.
      const booting = options.dumpConfig !== true && options.dumpDefaultConfig !== true
      const forwarded = commandName === 'sponge' && booting && !args.includes('--portal')
        ? ['--portal', ...args]
        : args
      resolved = resolveBoot(web, 'web', options, forwarded)
    })

  const editor = program.command('editor')
    .description('reserved: the Sponge Editor surface lands in a later release (open the Portal with: sponge web)')
  editor
    .helpOption('-h, --help', 'show this help')
    .allowUnknownOption()
    .argument('[args...]', 'arguments for the editor app (not yet available)')
    .action((args: string[]) => {
      rejectParentOptions('editor')
      const extra = args.length > 0 ? ` (got: ${args.join(' ')})` : ''
      program.error(`error: sponge editor is not yet available; the Editor surface lands in a later release — open the Portal with: sponge web${extra}`)
    })

  const plugin = program.command('plugin').description('manage a profile\'s plugins by forwarding the remaining arguments to pnpm in the profile directory')
  plugin
    .requiredOption('--profile <name>', 'the profile whose plugins to manage (initialized on first use)')
    .allowUnknownOption()
    .argument('[args...]', 'pnpm arguments, forwarded verbatim (add <pkg>, remove <pkg>, why <pkg>, ...)')
    .action((args: string[], options: { profile: string }) => {
      rejectParentOptions('plugin')
      if (options.profile === '') program.error('error: --profile needs a name')
      if (args.length === 0) program.error('error: plugin needs pnpm arguments to forward (e.g. add <package>)')
      resolved = { mode: 'plugin', profile: options.profile, args }
    })

  try {
    program.parse(argv, { from: 'user' })
  } catch (error) {
    return process.exit(error instanceof CommanderError ? error.exitCode : 1)
  }
  /* v8 ignore next -- an action resolves or Commander throws */
  if (resolved === undefined) throw new Error(`${commandName}: no invocation resolved`)
  return resolved
}
