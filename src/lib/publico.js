/* ============================================================================
 *  PORTFÓLIO PÚBLICO (conta real) · cálculo único usado pela Home e pela Mentoria
 *
 *  Base: CAPITAL_REAL, o capital que estava de fato na conta XP quando o
 *  portfólio começou (os 22.400 do cadastro eram só o capital recomendado).
 *  Método do saldo acumulado: a rentabilidade de cada mês é o resultado do mês
 *  dividido pelo saldo no início daquele mês (capital + resultado acumulado).
 *  Drawdown no nível das operações, sobre o pico do saldo.
 * ========================================================================== */

export const CAPITAL_REAL = 12000
export const NOME_PUBLICO = 'PORTFOLIO PUBLICO'
export const ID_PUBLICO = 38

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const normName = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()

export function opSortKey(d) {
  if (!d) return ''
  if (d.includes('/')) {
    const p = d.split('/'), y = (p[2] || '').split(' ')[0].padStart(4, '0')
    return `${y}${(p[1] || '').padStart(2, '0')}${(p[0] || '').padStart(2, '0')}`
  }
  return (d.split('T')[0] || '').replace(/-/g, '')
}

export function parseRobots(json) {
  try {
    const p = JSON.parse(json || '[]')
    if (!p.length) return []
    if (typeof p[0] === 'string') return p.map(name => ({ name, lotes: 1 }))
    return p.map(r => ({ name: r.name || String(r), lotes: Number(r.lotes) || 1 }))
  } catch { return [] }
}

export function getConfigVersions(portfolio) {
  try { const cv = JSON.parse(portfolio?.config_versions || '[]'); if (cv.length > 0) return cv } catch { /* fallback */ }
  return [{ valid_from: null, robots_json: portfolio?.robots_json || '[]' }]
}

export function getAllStrategyNames(portfolio) {
  const names = new Set()
  getConfigVersions(portfolio).forEach(v => parseRobots(v.robots_json).forEach(r => names.add(r.name)))
  return [...names]
}

/* cada operação recebe os lotes da versão de configuração válida na data dela */
export function applyLotesVersioned(ops, cv) {
  if (!ops.length || !cv || !cv.length) return ops
  const sorted = cv.slice().sort((a, b) => String(b.valid_from || '').localeCompare(String(a.valid_from || '')))
  const cache = new Map()
  const mapFor = (k) => {
    if (cache.has(k)) return cache.get(k)
    const v = sorted.find(x => !x.valid_from || String(x.valid_from) <= k)
    const map = {}
    if (v) parseRobots(v.robots_json).forEach(r => { map[r.name] = r.lotes || 1 })
    const res = v ? map : null
    cache.set(k, res)
    return res
  }
  const out = []
  for (const op of ops) {
    const map = mapFor(opSortKey(op.abertura))
    if (!map) continue
    const l = map[op.ativo]
    if (l === undefined) continue
    out.push(l === 1 ? op : { ...op, res_op: (op.res_op || 0) * l })
  }
  return out
}

export function findPublico(mentPortfolios) {
  const list = mentPortfolios || []
  return list.find(x => normName(x.name) === NOME_PUBLICO) || list.find(x => x.id === ID_PUBLICO) || null
}

/* Resultado completo do portfólio público pelo método do saldo acumulado */
export function computePublico(portfolio, allMentOps, base = CAPITAL_REAL) {
  if (!portfolio) return null
  const opsByName = {}
  ;(allMentOps || []).forEach(op => { const k = op.ativo; (opsByName[k] || (opsByName[k] = [])).push(op) })
  let ops = getAllStrategyNames(portfolio).flatMap(n => opsByName[n] || [])
  ops = applyLotesVersioned(ops, getConfigVersions(portfolio))
  if (ops.length < 2) return null
  ops = ops.slice().sort((a, b) => opSortKey(a.abertura).localeCompare(opSortKey(b.abertura)))

  let bal = base, peak = base, ddMax = 0
  ops.forEach(o => {
    bal += (o.res_op || 0)
    if (bal > peak) peak = bal
    const dd = (peak - bal) / peak * 100
    if (dd > ddMax) ddMax = dd
  })
  const total = ops.reduce((s, o) => s + (o.res_op || 0), 0)
  const acumulado = (total / base) * 100

  const byMonth = {}
  ops.forEach(o => { const k = opSortKey(o.abertura).slice(0, 6); byMonth[k] = (byMonth[k] || 0) + (o.res_op || 0) })
  const keys = Object.keys(byMonth).sort()
  let b2 = base
  const monthly = []
  keys.forEach(k => {
    const sum = byMonth[k]
    const v = b2 > 0 ? (sum / b2) * 100 : 0
    b2 += sum
    monthly.push({ k, m: `${MESES_PT[parseInt(k.slice(4, 6), 10) - 1]}/${k.slice(2, 4)}`, v })
  })
  const mediaMensal = monthly.length ? monthly.reduce((a, x) => a + x.v, 0) / monthly.length : 0

  return {
    ops, nOps: ops.length, base, total,
    monthly, acumulado, mediaMensal, ddMax,
    nMeses: monthly.length,
    from: monthly[0]?.m, to: monthly[monthly.length - 1]?.m,
    ini: (ops[0].abertura || '').slice(0, 10),
    fim: (ops[ops.length - 1].abertura || '').slice(0, 10),
  }
}
