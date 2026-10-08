/** Search a client bundle for main keyed entry registrations. Usage: node find-main.mjs <file> */
import { readFileSync } from 'node:fs'

const src = readFileSync(process.argv[2], 'utf8')

const find = (label, re, max) => {
  let m, n = 0
  while ((m = re.exec(src)) && n < max) {
    n++
    console.log(`--- ${label} ${n} at ${m.index} ---`)
    console.log(src.slice(Math.max(0, m.index - 600), m.index + 1000).replace(/\s+/g, ' '))
    console.log()
  }
  if (!n) console.log(`NO ${label.toUpperCase()}`)
}

find('name:"main"', /name:\s*["']main["']/g, 5)
find('key:"conversation"', /key:\s*["']conversation["']/g, 5)
find('main.conversation', /main\.conversation/g, 3)
