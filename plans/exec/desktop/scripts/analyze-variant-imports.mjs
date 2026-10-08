/** List all require() specifiers (external modules) in built variant bundles. */
import { readFileSync } from 'node:fs'

for (const pkg of ['ui-sponge-portal', 'ui-sponge-sandbox']) {
  const file = `D:/github projects/Sponge/packages/client/${pkg}/lib-upstream/client.js`
  const src = readFileSync(file, 'utf8')
  const re = /require\((['"])([^'"]+)\1\)/g
  const imports = new Set()
  let m
  while ((m = re.exec(src))) if (!m[2].startsWith('.')) imports.add(m[2])
  console.log(`=== ${pkg} (${imports.size}) ===`)
  console.log([...imports].sort().join('\n'))
  console.log()
}
