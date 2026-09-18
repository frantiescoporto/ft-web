import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/* ============================================================================
 *  Dados estáticos exportados do Trade Quant Lab (public/data/*.json)
 *
 *  Os portfólios e as operações da conta (mentorados-*) são leves e carregam
 *  sempre. O robots.json (cada robô com todas as operações, ~20 MB) só carrega
 *  nas rotas que precisam dele. A Home usa o resumo em stats.json.
 *
 *  Contrato de useData(): { robots, portfolios, mentPortfolios, mentOps,
 *  getRobot, loading }. `loading` fica true enquanto os dados que a rota
 *  atual usa não chegaram, então as páginas continuam guardando por `loading`.
 * ========================================================================== */

// rotas que NÃO usam robots.json
const ROTAS_LEVES = [
  '/', '/copa-dos-robos', '/resultado-do-mes', '/cadastro', '/avaliacoes',
  '/historico', '/mentoria_metodo6015',
]

// robôs de teste que não devem aparecer no site
const ROBOS_OCULTOS = new Set(['narnia'])
// nada de MetaTrader / OnTick no site: só plataformas Nelogica
const PLATAFORMAS_OK = new Set(['profit', 'blackarrow'])
const NOME_PROIBIDO = /mt5|meta ?trader|ontick|^on_/i
const roboOk = (x) => !ROBOS_OCULTOS.has(String(x.name || '').trim().toLowerCase())
  && PLATAFORMAS_OK.has(String(x.platform || 'profit').toLowerCase())
  && !NOME_PROIBIDO.test(x.name || '')
const portfolioOk = (p) => !NOME_PROIBIDO.test(p.name || '') && !NOME_PROIBIDO.test(p.logo || '')

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { pathname } = useLocation()
  const precisaRobots = !ROTAS_LEVES.includes(pathname)

  const [base, setBase] = useState({ portfolios: [], mentPortfolios: [], mentOps: [], loading: true })
  const [robots, setRobots] = useState([])
  const [robotsLoaded, setRobotsLoaded] = useState(false)
  const robotsReq = useRef(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [pRes, mpRes, moRes] = await Promise.all([
          fetch('/data/portfolios.json'),
          fetch('/data/mentorados-portfolios.json'),
          fetch('/data/mentorados-ops.json'),
        ])
        const [p, mp, mo] = await Promise.all([pRes.json(), mpRes.json(), moRes.json()])
        if (vivo) setBase({ portfolios: (p || []).filter(portfolioOk), mentPortfolios: (mp || []).filter(portfolioOk), mentOps: (mo || []).filter(o => !NOME_PROIBIDO.test(o.ativo || '')), loading: false })
      } catch (e) {
        console.error('DataContext error:', e)
        if (vivo) setBase(b => ({ ...b, loading: false }))
      }
    })()
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!precisaRobots || robotsReq.current) return
    robotsReq.current = true
    ;(async () => {
      try {
        const r = await (await fetch('/data/robots.json')).json()
        setRobots((r || []).filter(roboOk))
      } catch (e) {
        console.error('DataContext robots error:', e)
      } finally {
        setRobotsLoaded(true)
      }
    })()
  }, [precisaRobots])

  const loading = base.loading || (precisaRobots && !robotsLoaded)
  const getRobot = (id) => robots.find(r => r.id === Number(id)) || null

  return (
    <DataContext.Provider value={{ robots, portfolios: base.portfolios, mentPortfolios: base.mentPortfolios, mentOps: base.mentOps, getRobot, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
