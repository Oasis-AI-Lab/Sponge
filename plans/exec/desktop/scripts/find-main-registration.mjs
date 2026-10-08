/** Search the web-frontend bundle for main-slot registrations. */
import { readFileSync } from 'node:fs'

const src = readFileSync('D:/github projects/dsh-desktop/_tmp_unpack/web-frontend/package/dist/assets/index-BKQ_L1z6.js', 'utf8')

// Find every occurrence of name:"main" style register options with surrounding context.
const re = /name:\s*["']main["']/g
let m, count = 0
while ((m = re.exec(src)) && count < 10) {
  count++
  console.log(`--- hit ${count} at ${m.index} ---`)
  console.log(src.slice(Math.max(0, m.index - 500), m.index + 900).replace(/\s+/g, ' '))
  console.log()
}
if (!count) {
  // try key: "conversation" instead
  const re2 = /key:\s*["']conversation["']/g
  let n = 0
  while ((m = re2.exec(src)) && n < 5) {
    n++
    console.log(`--- key hit ${n} at ${m.index} ---`)
    console.log(src.slice(Math.max(0, m.index - 400), m.index + 700).replace(/\s+/g, ' '))
    console.log()
  }
  if (!n) console.log('NO MATCH EITHER')
}
