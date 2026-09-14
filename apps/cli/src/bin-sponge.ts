#!/usr/bin/env node
/**
 * sponge — Sponge-brand command-line entry. Shares the dsh dispatch; the
 * 'sponge' name turns the `web` alias into a Portal shortcut by forwarding
 * `--portal` to the web app (see @oasisailab/sponge/args).
 * @module @oasisailab/sponge/bin-sponge
 */

/* v8 ignore file -- built-bin acceptance exercises this self-executing dispatch. */

import { runCli } from './dispatch.ts'

await runCli(process.argv.slice(2), 'sponge')
