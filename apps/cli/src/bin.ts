#!/usr/bin/env node
/**
 * dsh — command-line entry. Dynamic imports per mode keep unrelated modes out
 * of each dispatch path; the adapter prints and exits for
 * `--help`/`--version`/a parse error, so only a valid mode reaches the switch.
 * @module @oasisailab/sponge/bin
 */

/* v8 ignore file -- built-bin acceptance exercises this self-executing dispatch. */

import path from 'node:path'
import { runCli } from './dispatch.ts'

// Node resolves argv[1] through package-manager bin links on Unix; a Windows
// shim points at this file directly, so the legacy `dsh` name is the fallback.
const commandName = path.basename(process.argv[1] ?? '') === 'sponge' ? 'sponge' : 'dsh'
await runCli(process.argv.slice(2), commandName)
