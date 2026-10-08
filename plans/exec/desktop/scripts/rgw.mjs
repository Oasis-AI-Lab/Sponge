/** rg wrapper for Windows/PowerShell-hostile quoting. Usage: node rgw.mjs <pattern> <dir> [glob] */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const pattern = process.argv[2]
const dir = process.argv[3]
const glob = process.argv[4] ?? '*.js'
if (!existsSync(dir)) { console.log('DIR MISSING:', dir); process.exit(0) }
try {
  const out = execFileSync('rg', ['-n', '--glob', glob, pattern, dir], { encoding: 'utf8', maxBuffer: 1e7 })
  process.stdout.write(out)
} catch (e) {
  if (e.status === 1) console.log('NO MATCH')
  else console.log('RG ERR', e.message.slice(0, 500))
}
