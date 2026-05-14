import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { fmtNum } from '../lib/analytics.js'

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99',
}

function fmtR(v) {
  if (v == null || isNaN(v)) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PortfoliosRecomendadosPage() {
  const navigate = useNavigate()
  const { robots, mentPortfolios, mentOps, loading } = useData()
  const LOGOS_NELOGICA = ['6015', 'nelogica', 'smartlab', 'mentoria', '']
  const portfolios = (mentPortfolios || []).filter(p => LOGOS_NELOGICA.includes(p.logo || ''))
  const [portfolioMetrics, setPortfolioMetrics] = useState({})

  useEffect(() => {
    if (!mentOps?.length || !portfolios.length) return
    // Indexa ops por nome da estratégia
    const opsByName = {}
    mentOps.forEach(op => {
      const k = op.ativo
      if (!opsByName[k]) opsByName[k] = []
      opsByName[k].push(op)
    })
    const pm = {}
    for (const p of portfolios) {
      try {
        const robotsList = typeof p.robots_json === 'string' ? JSON.parse(p.robots_json) : (p.robots_json || [])
        if (!robotsList.length) continue
        // Montar ops do portfólio
        const ops = robotsList.flatMap(r => (opsByName[r.name] || []).map(op => ({
          ...op, res_op: (op.res_op || 0) * (r.lotes || 1)
        })))
        if (!ops.length) { pm[p.id] = { noOps: true, robotsList }; continue }
        // Métricas básicas
        const wins = ops.filter(o => o.res_op > 0).length
        const losses = ops.filter(o => o.res_op < 0).length
        const totalBruto = ops.reduce((a, o) => a + o.res_op, 0)
        const gainSum = ops.filter(o => o.res_op > 0).reduce((a, o) => a + o.res_op, 0)
        const lossSum = Math.abs(ops.filter(o => o.res_op < 0).reduce((a, o) => a + o.res_op, 0))
        const profitFactor = lossSum > 0 ? gainSum / lossSum : gainSum > 0 ? 99 : 0
        const winRate = ops.length ? (wins / ops.length) * 100 : 0
        // Média mensal
        const monthly = {}
        ops.forEach(op => {
          const pts = (op.abertura || '').split(' ')[0].split('/')
          if (pts.length === 3) {
            const key = `${pts[2]}-${pts[1]}`
            monthly[key] = (monthly[key] || 0) + op.res_op
          }
        })
        const vals = Object.values(monthly)
        const avgMonthly = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        // Max DD
        let peak = 0, maxDD = 0, acc = 0
        ops.sort((a,b) => (a.abertura||'').localeCompare(b.abertura||'')).forEach(op => {
          acc += op.res_op
          if (acc > peak) peak = acc
          const dd = peak - acc
          if (dd > maxDD) maxDD = dd
        })
        pm[p.id] = {
          totalBruto, profitFactor, winRate, avgMonthly,
          nMonths: vals.length, nRobots: robotsList.length,
          maxDD, robotsList, ops
        }
      } catch (e) { console.error('Portfolio error:', e) }
    }
    setPortfolioMetrics(pm)
  }, [mentOps, portfolios])

  if (loading) return (
    <div style={{ background: s.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted }}>
      Carregando portfólios...
    </div>
  )

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Início
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>🎯 Portfólios Recomendados</h1>
          <p style={{ color: s.muted, fontSize: 14 }}>
            {portfolios.length} portfólios · Montados e validados pelo Método 6015 · Clique para ver análise completa
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {portfolios.map(p => {
            const m = portfolioMetrics[p.id]
            return (
              <Link key={p.id} to={`/portfolios-recomendados/${p.id}`}
                style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'all .2s', display: 'block', textDecoration: 'none', color: s.text }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent + '88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.transform = 'translateY(0)' }}>

                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>{p.name}</div>

                {m?.robotsList && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {m.robotsList.slice(0, 6).map((r, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '2px 8px', background: s.accent+'14', border: `1px solid ${s.accent}33`, borderRadius: 99, color: s.accent, fontWeight: 600 }}>
                        {r.name}{r.lots > 1 ? ` ×${r.lots}` : ''}
                      </span>
                    ))}
                    {m.robotsList.length > 6 && (
                      <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 99, color: s.muted }}>
                        +{m.robotsList.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {m ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { l: 'Total BT', v: fmtR(m.totalBruto || 0), c: (m.totalBruto||0) >= 0 ? '#34d47e' : '#f06060' },
                      { l: 'Méd. mensal', v: fmtR(m.avgMonthly || 0), c: (m.avgMonthly||0) >= 0 ? '#34d47e' : '#f06060' },
                      { l: 'Win Rate', v: (m.winRate||0).toFixed(0)+'%', c: (m.winRate||0) >= 55 ? '#34d47e' : '#f5a623' },
                      { l: 'P. Factor', v: fmtNum(Math.min(m.profitFactor||0, 99)), c: (m.profitFactor||0) >= 1.5 ? '#34d47e' : '#f5a623' },
                      { l: 'Estratégias', v: m.nRobots, c: s.text },
                      { l: 'Meses BT', v: m.nMonths, c: s.text },
                    ].map((st, i) => (
                      <div key={i} style={{ background: s.surface, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: s.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{st.l}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: st.c }}>{st.v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: s.muted }}>Calculando...</div>
                )}

                <div style={{ marginTop: 14, fontSize: 12, color: s.accent, fontWeight: 600, textAlign: 'right' }}>
                  Ver análise completa →
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ marginTop: 40, background: `linear-gradient(135deg, ${s.accent}12, ${s.card})`, border: `1px solid ${s.accent}33`, borderRadius: 16, padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Quer operar com um portfólio validado?</h2>
          <p style={{ color: s.muted, fontSize: 14, marginBottom: 20 }}>Entre em contato para saber qual portfólio faz sentido para o seu capital.</p>
          <a href={`https://wa.me/5553999010262?text=${encodeURIComponent('Olá! Tenho interesse nos portfólios recomendados do Método 6015.')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: s.accent, color: '#000', padding: '13px 28px', borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            💬 Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
