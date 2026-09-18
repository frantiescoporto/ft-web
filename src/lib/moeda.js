/* ============================================================================
 *  Moeda por robô / portfólio
 *
 *  O Trade Quant Lab grava tudo como número sem moeda e o site sempre imprimiu
 *  "R$". Os robôs de mercado internacional (plataforma Black Arrow, corretora
 *  DooPrime) operam em dólar, então o site decide a moeda por aqui:
 *    · robô: platform === 'blackarrow'  → USD
 *    · portfólio: nome começa com DOO_PRIME / DOOPRIME → USD
 * ========================================================================== */

export const RX_DOOPRIME = /^\s*doo[_\s-]?prime/i

export function moedaDoRobo(r) {
  return String(r?.platform || 'profit').toLowerCase() === 'blackarrow' ? 'USD' : 'BRL'
}

export function moedaDoPortfolio(p) {
  return RX_DOOPRIME.test(p?.name || '') ? 'USD' : 'BRL'
}

export const simbolo = (moeda) => (moeda === 'USD' ? 'US$' : 'R$')

export function fmtMoeda(v, moeda = 'BRL', dec = 2) {
  if (v == null || isNaN(v)) return '—'
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  return (v < 0 ? '-' : '') + simbolo(moeda) + ' ' + abs
}

/* capital recomendado em dólar a partir do nome "DOO_PRIME | 500" */
export function capitalDoNome(nome) {
  const m = /\|\s*([\d.,]+)\s*(k)?/i.exec(nome || '')
  if (!m) return null
  let n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
  if (m[2]) n *= 1000
  return Number.isFinite(n) ? n : null
}
