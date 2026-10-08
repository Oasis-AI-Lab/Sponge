/** Grep patterns in a file, print short surrounding context. Usage: node grepp.mjs <file> <pattern> <ctxchars> [max] */
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const pattern = process.argv[3]
const ctx = Number(process.argv[4] ?? 200)
const max = Number(process.argv[5] ?? 6)
const src = readFileSync(file, 'utf8')
const re = new RegExp(pattern, 'g')
let m, count = 0
while ((m = re.exec(src)) && count < max) {
  count++
  const start = Math.max(0, m.index - ctx / 2)
  console.log(`--- hit ${count} ---`)
  console.log(src.slice(start, m.index + ctx).replace(/\s+/g, ' '))
  console.log()
}
if (!count) console.log('NO MATCH')
