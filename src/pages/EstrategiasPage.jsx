import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, calcMetrics, fmtNum } from '../lib/analytics.js'
import PlatformBadge from '../components/PlatformBadge.jsx'

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99',
}

function fmtR(v) {
  if (v == null || isNaN(v)) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function EstrategiasPage() {
  const navigate = useNavigate()
  const { robots, loading } = useData()
  const [metrics, setMetrics] = useState({})
  const [filterAtivo, setFilterAtivo] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('m6015')

  useEffect(() => {
    if (!robots.length) return
    const m = {}
    for (const r of robots) {
      if (r.operations?.length) {
        const adj = buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest')
        const calc = calcMetrics(adj)
        const monthly = {}
        adj.forEach(o => {
          const pts = (o.abertura || '').split(' ')[0].split('/')
          const key = `${pts[2]}-${pts[1]}`
          monthly[key] = (monthly[key] || 0) + o.resAdj
        })
        const vals = Object.values(monthly)
        calc.avgMonthly = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        if (r.realOps?.length) {
          const rm = {}
          r.realOps.forEach(o => {
            const pts = (o.abertura || '').split(' ')[0].split('/')
            if (pts.length === 3) {
              const key = `${pts[2]}-${pts[1]}`
              rm[key] = (rm[key] || 0) + (o.res_op || 0)
            }
          })
          const rv = Object.values(rm)
          calc.avgMonthlyReal = rv.length ? rv.reduce((a, b) => a + b, 0) / rv.length : null
          calc.nMonthsReal = rv.length
        }
        m[r.id] = calc
      }
    }
    setMetrics(m)
  }, [robots])

  const ativoOptions = [...new Set(robots.map(r => r.ativo).filter(Boolean))].sort()
  const typeOptions = [...new Set(robots.map(r => r.strategy_type).filter(Boolean))].sort()

  const filtered = [...robots]
    .filter(r => {
      if (filterAtivo !== 'all' && r.ativo !== filterAtivo) return false
      if (filterPlatform !== 'all' && (r.platform || 'profit') !== filterPlatform) return false
      if (filterType !== 'all' && r.strategy_type !== filterType) return false
      return true
    })
    .sort((a, b) => {
      const ma = metrics[a.id] || {}, mb = metrics[b.id] || {}
      if (sortBy === 'm6015') return (mb.m6015 || 0) - (ma.m6015 || 0)
      if (sortBy === 'winRate') return (mb.winRate || 0) - (ma.winRate || 0)
      if (sortBy === 'pf') return (mb.profitFactor || 0) - (ma.profitFactor || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  if (loading) return (
    <div style={{ background: s.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted }}>
      Carregando estratégias...
    </div>
  )

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Início
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Estratégias</h1>
          <p style={{ color: s.muted, fontSize: 14 }}>
            {filtered.length} estratégias · Clique para ver análise completa
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterAtivo} onChange={e => setFilterAtivo(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${s.border}`, borderRadius: 8, background: s.surface, color: s.text, cursor: 'pointer' }}>
            <option value="all">Todos os ativos</option>
            {ativoOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${s.border}`, borderRadius: 8, background: s.surface, color: s.text, cursor: 'pointer' }}>
            <option value="all">Todas as plataformas</option>
            <option value="profit">Profit</option>
            <option value="mt5">MetaTrader 5</option>
          </select>
          {typeOptions.length > 0 && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${s.border}`, borderRadius: 8, background: s.surface, color: s.text, cursor: 'pointer' }}>
              <option value="all">Todos os tipos</option>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: s.muted }}>Ordenar:</span>
            {[
              { k: 'm6015', l: 'M.6015' },
              { k: 'winRate', l: 'Win Rate' },
              { k: 'pf', l: 'P.Factor' },
              { k: 'name', l: 'Nome' },
            ].map(opt => (
              <button key={opt.k} onClick={() => setSortBy(opt.k)}
                style={{ padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 8, border: `1px solid ${s.border}`, background: sortBy === opt.k ? s.accent : 'transparent', color: sortBy === opt.k ? '#000' : s.muted, fontWeight: sortBy === opt.k ? 700 : 400 }}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(r => {
            const m = metrics[r.id]
            return (
              <Link key={r.id} to={`/estrategias/${r.id}`}
                style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px', cursor: 'pointer', transition: 'all .2s', display: 'block', textDecoration: 'none', color: s.text }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.transform = 'translateY(0)' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <PlatformBadge platform={r.platform} size={15} />
                  {r.strategy_type && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(155,124,244,0.1)', color: '#9b7cf4', fontWeight: 600 }}>
                      {r.strategy_type}
                    </span>
                  )}
                  {r.realOps?.length > 0 && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(52,212,126,0.1)', color: '#34d47e', fontWeight: 600, marginLeft: 'auto' }}>
                      Real
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: m ? 10 : 6 }}>{r.name}</div>

                {m ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {[
                      { l: 'M.6015', v: fmtNum(m.m6015 || 0), c: (m.m6015||0)>3?'#34d47e':(m.m6015||0)>1?'#f5a623':'#f06060' },
                      { l: 'Win Rate', v: (m.winRate||0).toFixed(0)+'%', c: (m.winRate||0)>=55?'#34d47e':'#f5a623' },
                      { l: 'Méd. BT/mês', v: fmtR(m.avgMonthly||0), c: (m.avgMonthly||0)>=0?'#34d47e':'#f06060' },
                      m.avgMonthlyReal != null
                        ? { l: `Real (${m.nMonthsReal}m)`, v: fmtR(m.avgMonthlyReal), c: m.avgMonthlyReal>=0?'#34d47e':'#f06060' }
                        : { l: 'Conta real', v: '—', c: s.muted },
                    ].map((st, i) => (
                      <div key={i} style={{ background: s.surface, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: s.muted, marginBottom: 2 }}>{st.l}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: st.c }}>{st.v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: s.muted, marginBottom: 10 }}>{r.operations?.length || 0} operações</div>
                )}

                <div style={{ fontSize: 12, color: s.accent, fontWeight: 600 }}>
                  Ver análise completa →
                </div>
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: s.muted }}>
            Nenhuma estratégia encontrada com esses filtros.
          </div>
        )}
      </div>
    </div>
  )
}
