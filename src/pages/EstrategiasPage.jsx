import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, calcMetrics, fmtNum } from '../lib/analytics.js'
import PlatformBadge from '../components/PlatformBadge.jsx'

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99',
  pos: '#34d47e', neg: '#f06060', warn: '#f5a623',
}

const fmtPct = (v, sign = false) => {
  if (v == null || isNaN(v)) return '—'
  const n = Number(v)
  return `${sign && n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default function EstrategiasPage() {
  const navigate = useNavigate()
  const { robots, loading } = useData()
  const [metrics, setMetrics] = useState({})
  const [filterAtivo, setFilterAtivo] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('rentMensal')

  useEffect(() => {
    if (!robots.length) return
    const m = {}
    for (const r of robots) {
      if (r.operations?.length) {
        const adj = buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest')
        const calc = calcMetrics(adj)
        // rentabilidade média mensal (backtest) — mesmo cálculo do detalhe: rentPct / (anos*12)
        calc.rentMensal = (calc.anos && calc.anos > 0) ? (calc.rentPct || 0) / (calc.anos * 12) : null
        // tempo em conta real (meses distintos com operação real)
        if (r.realOps?.length) {
          const rm = {}
          r.realOps.forEach(o => {
            const pts = (o.abertura || '').split(' ')[0].split('/')
            if (pts.length === 3) { const key = `${pts[2]}-${pts[1]}`; rm[key] = (rm[key] || 0) + (o.res_op || 0) }
          })
          calc.nMonthsReal = Object.keys(rm).length
        } else {
          calc.nMonthsReal = 0
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
      if ((r.platform || 'profit') === 'mt5') return false
      if (filterAtivo !== 'all' && r.ativo !== filterAtivo) return false
      if (filterType !== 'all' && r.strategy_type !== filterType) return false
      return true
    })
    .sort((a, b) => {
      const ma = metrics[a.id] || {}, mb = metrics[b.id] || {}
      if (sortBy === 'rentMensal') return (mb.rentMensal ?? -1e9) - (ma.rentMensal ?? -1e9)
      if (sortBy === 'winRate') return (mb.winRate || 0) - (ma.winRate || 0)
      if (sortBy === 'pf') return (mb.profitFactor || 0) - (ma.profitFactor || 0)
      if (sortBy === 'real') return (mb.nMonthsReal || 0) - (ma.nMonthsReal || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  if (loading) return (
    <div style={{ background: s.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted }}>
      Carregando estratégias...
    </div>
  )

  const th = { textAlign: 'left', fontSize: 11, color: s.muted, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', padding: '12px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${s.border}` }
  const thR = { ...th, textAlign: 'right' }
  const td = { padding: '14px', borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: 14, whiteSpace: 'nowrap' }
  const tdR = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← Início</button>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Estratégias</h1>
          <p style={{ color: s.muted, fontSize: 14 }}>{filtered.length} estratégias · Clique numa linha para ver a análise completa</p>
        </div>

        {/* Filtros + ordenação */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterAtivo} onChange={e => setFilterAtivo(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${s.border}`, borderRadius: 8, background: s.surface, color: s.text, cursor: 'pointer' }}>
            <option value="all">Todos os ativos</option>
            {ativoOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {typeOptions.length > 0 && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${s.border}`, borderRadius: 8, background: s.surface, color: s.text, cursor: 'pointer' }}>
              <option value="all">Todos os tipos</option>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: s.muted }}>Ordenar:</span>
            {[
              { k: 'rentMensal', l: '% ao mês' },
              { k: 'pf', l: 'Fator de lucro' },
              { k: 'winRate', l: 'Taxa de acerto' },
              { k: 'real', l: 'Conta real' },
              { k: 'name', l: 'Nome' },
            ].map(opt => (
              <button key={opt.k} onClick={() => setSortBy(opt.k)}
                style={{ padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 8, border: `1px solid ${s.border}`, background: sortBy === opt.k ? s.accent : 'transparent', color: sortBy === opt.k ? '#000' : s.muted, fontWeight: sortBy === opt.k ? 700 : 400 }}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 12, background: s.card }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>
                <th style={th}>Robô</th>
                <th style={thR}>Fator de lucro</th>
                <th style={thR}>Taxa de acerto</th>
                <th style={thR}>Conta real</th>
                <th style={thR}>Rent. média/mês<div style={{ fontSize: 9, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: s.muted }}>backtest</div></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const m = metrics[r.id] || {}
                const pf = m.profitFactor
                const rent = m.rentMensal
                return (
                  <tr key={r.id}
                    onClick={() => navigate(`/estrategias/${r.id}`)}
                    style={{ cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlatformBadge platform={r.platform} size={14} />
                        <span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{r.name}</span>
                        {r.strategy_type && (
                          <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 99, background: 'rgba(155,124,244,0.12)', color: '#9b7cf4', fontWeight: 600 }}>{r.strategy_type}</span>
                        )}
                        {r.ativo && <span style={{ fontSize: 11, color: s.muted }}>{r.ativo}</span>}
                      </div>
                    </td>
                    <td style={{ ...tdR, fontWeight: 700, color: (pf || 0) >= 1.5 ? s.pos : (pf || 0) >= 1 ? s.warn : s.neg }}>
                      {pf == null ? '—' : fmtNum(pf > 99 ? 99 : pf)}
                    </td>
                    <td style={{ ...tdR, color: (m.winRate || 0) >= 55 ? s.pos : (m.winRate || 0) >= 45 ? s.warn : s.neg }}>
                      {m.winRate == null ? '—' : `${(m.winRate).toFixed(0)}%`}
                    </td>
                    <td style={tdR}>
                      {m.nMonthsReal > 0
                        ? <span style={{ color: s.pos, fontWeight: 600 }}>{m.nMonthsReal} {m.nMonthsReal === 1 ? 'mês' : 'meses'}</span>
                        : <span style={{ color: s.muted }}>—</span>}
                    </td>
                    <td style={{ ...tdR, fontWeight: 700, color: rent == null ? s.muted : rent >= 0 ? s.pos : s.neg }}>
                      {fmtPct(rent, true)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: s.muted }}>
            Nenhuma estratégia encontrada com esses filtros.
          </div>
        )}

        <p style={{ color: s.muted, fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
          Rentabilidade média mensal calculada sobre o capital necessário (backtest). "Conta real" mostra há quantos meses a estratégia opera em conta real.
          Resultados passados não garantem retornos futuros.
        </p>
      </div>
    </div>
  )
}
