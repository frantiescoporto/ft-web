import React, { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

/* Navegação compartilhada de todas as rotas públicas.
 * Desktop: links inline. Mobile (<860px): botão que abre o menu em lista. */

export const NAV_LINKS = [
  { to: '/mentoria_metodo6015', label: 'Mentoria' },
  { to: '/copa-dos-robos', label: 'Copa' },
  { to: '/mercado-internacional', label: 'Internacional' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/estrategias', label: 'Robôs' },
  { to: '/resultado-do-mes', label: 'Resultado do mês' },
  { to: '/historico', label: 'História' },
]

// CTA da nav muda conforme a página: na Mentoria leva ao preço, no resto leva aos resultados
function ctaFor(pathname) {
  if (pathname.startsWith('/mentoria')) return { to: '/mentoria_metodo6015#preco', label: 'Garantir minha vaga', grad: true, hash: true }
  if (pathname.startsWith('/mercado-internacional')) return { to: 'https://my.dooprime.com/pt/links/go/71702', label: 'Abrir conta', grad: true, external: true }
  if (pathname.startsWith('/copa')) return { to: 'https://payfast.greenn.com.br/ug3vjsm', label: 'Assinar o Combo', grad: true, external: true }
  return { to: '/resultados', label: 'Ver resultados', grad: false }
}

export default function SiteNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const cta = ctaFor(pathname)

  // fecha o menu ao trocar de rota e trava o scroll enquanto aberto
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const Cta = ({ className }) => cta.external
    ? <a className={className} href={cta.to} target="_blank" rel="noopener noreferrer">{cta.label}</a>
    : cta.hash
      ? <a className={className} href={cta.to} onClick={() => setOpen(false)}>{cta.label}</a>
      : <Link className={className} to={cta.to}>{cta.label}</Link>

  const ctaClass = 'ft-cta' + (cta.grad ? ' grad' : '')

  return (
    <nav className={'ft-nav' + (open ? ' open' : '')} aria-label="Principal">
      <div className="ft-nav-in">
        <Link className="ft-brand" to="/">Frantiesco <span>Trader</span></Link>

        <div className="ft-links">
          {NAV_LINKS.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          <Cta className={ctaClass} />
        </div>

        <button
          className="ft-burger"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </div>

      <div className="ft-menu">
        <NavLink to="/" end>Início</NavLink>
        {NAV_LINKS.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
        <NavLink to="/avaliacoes">Avaliações</NavLink>
        <Cta className={ctaClass} />
      </div>
    </nav>
  )
}
