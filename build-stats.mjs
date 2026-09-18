/* ============================================================================
 *  build-stats.mjs · gera public/data/stats.json a partir do robots.json
 *
 *  A Home mostra só dois números vindos dos robôs (quantidade de estratégias
 *  publicadas e fator de lucro médio). Em vez de baixar os ~20 MB do
 *  robots.json pra isso, ela lê este resumo.
 *
 *  Rodar SEMPRE depois do export:
 *    node export-data-ft.cjs --db "..." && node build-stats.mjs
 *  (ou só `npm run data`)
 * ========================================================================== */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAdjOps, calcMetrics } from './src/lib/analytics.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(root, 'public', 'data')

const OCULTOS = new Set(['narnia'])

const robots = JSON.parse(fs.readFileSync(path.join(dataDir, 'robots.json'), 'utf8'))
  .filter(r => !OCULTOS.has(String(r.name || '').trim().toLowerCase()))

// mesma regra da Home: só Profit/Nelogica (sem MT5), e só robô com operação publicada
const pub = robots.filter(r => (r.platform || 'profit') !== 'mt5')
const pfs = []
let comOps = 0
for (const r of pub) {
  if (!r.operations?.length) continue
  comOps++
  const m = calcMetrics(buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest'))
  if (m.profitFactor) pfs.push(m.profitFactor)
}
const pfMedio = pfs.length ? pfs.reduce((a, b) => a + b, 0) / pfs.length : 0

const out = {
  geradoEm: new Date().toISOString().slice(0, 10),
  nEstrat: comOps,
  pfMedio: Number(pfMedio.toFixed(4)),
  totalRobos: robots.length,
}
fs.writeFileSync(path.join(dataDir, 'stats.json'), JSON.stringify(out, null, 2) + '\n')
console.log('stats.json:', out)
