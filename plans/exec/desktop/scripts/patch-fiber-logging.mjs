/** Patch the served web-frontend bundle to log loader fiber failure reasons. */
import { readFileSync, writeFileSync } from 'node:fs'

const file = 'D:/github projects/dsh-desktop/dsh-plugin-desktop/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BKQ_L1z6.js'
let src = readFileSync(file, 'utf8')

const single = 'if(i.length===1)throw i[0];'
const singlePatched = 'if(i.length===1){console.error("FIBER_REASON",i[0]&&i[0].stack||String(i[0]));throw i[0]}'
const multi = 'if(i.length>1)throw new AggregateError(i,"loader fibers failed");'
const multiPatched = 'if(i.length>1){for(const e of i)console.error("FIBER_REASON",e&&e.stack||String(e));throw new AggregateError(i,"loader fibers failed")}'

if (!src.includes(single)) { console.error('SINGLE PHRASE NOT FOUND'); process.exit(1) }
if (!src.includes(multi)) { console.error('MULTI PHRASE NOT FOUND'); process.exit(1) }

src = src.replace(single, singlePatched).replace(multi, multiPatched)
writeFileSync(file, src)
console.log('patched OK')
