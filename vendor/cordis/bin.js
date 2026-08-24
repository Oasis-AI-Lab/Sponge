#!/usr/bin/env node

import { Context } from '@oasisailab/sponge-cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@oasisailab/sponge-cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@oasisailab/sponge-cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
