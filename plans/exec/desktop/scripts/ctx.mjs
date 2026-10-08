/** Find and print context around a keyword in a file. Usage: node ctx.mjs <file> <keyword> <chars-before> <chars-after> */
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const kw = process.argv[3]
const before = Number(process.argv[4] ?? 1500)
const after = Number(process.argv[5] ?? 1500)
const src = readFileSync(file, 'utf8')
let i = -1
let count = 0
while ((i = src.indexOf(kw, i + 1)) >= 0 && count < 3) {
  count++
  console.log(`--- hit ${count} at ${i} ---`)
  console.log(src.slice(Math.max(0, i - before), i + after))
  console.log()
}
if (!count) console.log('NOT FOUND')
