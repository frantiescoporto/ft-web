import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteNav from './SiteNav.jsx'
import SiteFooter from './SiteFooter.jsx'

/* Layout das rotas públicas: nav + footer compartilhados, scroll ao topo
 * a cada troca de rota e título/description por página. */

const SITE = 'Frantiesco Trader'
const DEFAULT_DESC = 'Estratégias quantitativas rodando em conta real, com o histórico aberto. Método 6015.'

const META = {
  '/': { title: `${SITE} · Método 6015`, desc: DEFAULT_DESC },
  '/estrategias': { title: `Robôs e estratégias · ${SITE}`, desc: 'Cada estratégia do Método 6015 com análise completa: M.6015, win rate, fator de lucro e resultado em conta real.' },
  '/resultados': { title: `Resultados em conta real · ${SITE}`, desc: 'Portfólios recomendados do Método 6015 com resultado publicado em conta real, mês a mês.' },
  '/resultado-do-mes': { title: `Resultado do mês · ${SITE}`, desc: 'Fechamento do mês em conta real, pregão a pregão, robô por robô.' },
  '/mercado-internacional': { title: `Mercado internacional · ${SITE}`, desc: 'Robôs Black Arrow de ouro, índices e forex, em dólar, liberados sem custo pra quem abre conta na DooPrime pelo link do Frantiesco.' },
  '/copa-dos-robos': { title: `Copa dos Robôs · ${SITE}`, desc: 'Competição ao vivo entre 24 robôs em duas séries, com acesso e rebaixamento a cada mês.' },
  '/mentoria_metodo6015': { title: `Mentoria Método 6015 · ${SITE}`, desc: 'Um método pronto, passo a passo, pra operar com robôs no Profit do mesmo jeito que um trader profissional opera.' },
  '/avaliacoes': { title: `Avaliações dos alunos · ${SITE}`, desc: 'O que os alunos da Mentoria Método 6015 dizem, com nota e depoimento.' },
  '/historico': { title: `Minha história · ${SITE}`, desc: 'A trajetória do Frantiesco no mercado desde 2017, com os acertos e as quedas.' },
  '/cadastro': { title: `Cadastro de cliente · ${SITE}`, desc: 'Cadastro de clientes do Frantiesco Trader.' },
}

function metaFor(pathname) {
  if (META[pathname]) return META[pathname]
  if (pathname.startsWith('/estrategias/')) return { title: `Análise da estratégia · ${SITE}`, desc: META['/estrategias'].desc }
  return META['/']
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

export default function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const m = metaFor(pathname)
    document.title = m.title
    setMeta('description', m.desc)
    const og = document.querySelector('meta[property="og:title"]')
    if (og) og.setAttribute('content', m.title)
  }, [pathname])

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { el.scrollIntoView({ block: 'start' }); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <>
      <SiteNav />
      <main className="ft-main"><Outlet /></main>
      <SiteFooter />
    </>
  )
}
