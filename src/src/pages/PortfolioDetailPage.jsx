import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, fmtNum, fmtR } from '../lib/analytics.js'
import { buildPortfolioTimeline, calcPortfolioMetrics } from '../lib/portfolio.js'
import { Line } from 'react-chartjs-2'
import {
  Chart, CategoryScale, LinearScale, LineElement,
  PointElement, Tooltip, Filler,
} from 'chart.js'
try { Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler) } catch (_) {}

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99',
}

const MN = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(v) {
  if (v == null || isNaN(v)) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Aba Visão Geral ──────────────────────────────────────────────────────────
function VisaoGeralTab({ portfolio, entries, metrics, timeline }) {
  const curveData = (() => {
    let acc = 0
    const labels = [], data = []
    const step = Math.max(1, Math.floor(timeline.length / 300))
    timeline.forEach((op, i) => {
      acc += op.res_op || 0
      if (i % step === 0 || i === timeline.length - 1) {
        labels.push((op.abertura || '').split(' ')[0])
        data.push(parseFloat(acc.toFixed(2)))
      }
    })
    return { labels, data }
  })()

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { l: 'Total backtest', v: fmt(metrics.totalBruto), c: (metrics.totalBruto||0) >= 0 ? '#34d47e' : '#f06060' },
          { l: 'Média mensal', v: fmt(metrics.avgMonthly), c: (metrics.avgMonthly||0) >= 0 ? '#34d47e' : '#f06060' },
          { l: 'Win Rate', v: (metrics.winRate||0).toFixed(1)+'%', c: (metrics.winRate||0) >= 55 ? '#34d47e' : '#f5a623' },
          { l: 'Profit Factor', v: fmtNum(Math.min(metrics.profitFactor||0, 99)), c: (metrics.profitFactor||0) >= 1.5 ? '#34d47e' : '#f5a623' },
          { l: 'Max Drawdown', v: fmt(metrics.maxDD), c: '#f06060' },
          { l: 'Operações', v: timeline.length.toLocaleString('pt-BR') },
          { l: 'Meses', v: metrics.nMonths || '—' },
          { l: 'Estratégias', v: entries.length },
        ].map((st, i) => (
          <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: s.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{st.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: st.c || s.text }}>{st.v}</div>
          </div>
        ))}
      </div>

      {/* Curva de capital */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: s.muted }}>Curva de capital (backtest)</div>
        {curveData.data.length > 1 ? (
          <Line
            data={{ labels: curveData.labels, datasets: [{ data: curveData.data, borderColor: s.accent, backgroundColor: s.accent+'18', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] }}
            options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: s.muted, font: { size: 10 } } } } }}
          />
        ) : <div style={{ color: s.muted, textAlign: 'center', padding: 20 }}>Sem dados suficientes</div>}
      </div>

      {/* Composição */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: s.muted }}>Composição</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {entries.map((e, i) => (
            <div key={i} style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{e.robot.name}</span>
              <span style={{ fontSize: 11, color: s.muted }}>{e.robot.ativo}</span>
              {e.lots > 1 && <span style={{ fontSize: 11, background: s.accent+'20', color: s.accent, padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>×{e.lots}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Aba Mensal ───────────────────────────────────────────────────────────────
function MensalTab({ timeline }) {
  const monthly = {}
  timeline.forEach(op => {
    const pts = (op.abertura || '').split(' ')[0].split('/')
    if (pts.length === 3) {
      const y = pts[2], m = parseInt(pts[1]) - 1
      if (!monthly[y]) monthly[y] = Array(12).fill(null)
      monthly[y][m] = (monthly[y][m] || 0) + (op.res_op || 0)
    }
  })
  const years = Object.keys(monthly).sort().reverse()
  if (!years.length) return <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>Sem dados mensais</div>

  return (
    <div>
      {years.map(year => {
        const total = monthly[year].reduce((a, v) => a + (v || 0), 0)
        return (
          <div key={year} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: s.accent }}>{year}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: total >= 0 ? '#34d47e' : '#f06060' }}>Total: {fmt(total)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {monthly[year].map((val, mi) => {
                const pos = val !== null && val >= 0
                return (
                  <div key={mi} style={{ background: val !== null ? (pos ? 'rgba(52,212,126,0.12)' : 'rgba(240,96,96,0.12)') : 'rgba(255,255,255,0.03)', border: `1px solid ${val !== null ? (pos ? 'rgba(52,212,126,0.3)' : 'rgba(240,96,96,0.3)') : s.border}`, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: s.muted, marginBottom: 4 }}>{MN[mi]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: val !== null ? (pos ? '#34d47e' : '#f06060') : 'rgba(255,255,255,0.15)' }}>
                      {val !== null ? fmt(val) : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Aba Estratégias ──────────────────────────────────────────────────────────
function EstrategiasTab({ entries }) {
  const rows = entries.map(e => {
    const ops = e.adjOps || []
    const wins = ops.filter(o => o.resAdj > 0).length
    const total = ops.reduce((a, o) => a + (o.resAdj || 0), 0) * e.lots
    return { name: e.robot.name, ativo: e.robot.ativo, lots: e.lots, nOps: ops.length, wr: ops.length ? (wins / ops.length) * 100 : 0, total }
  })
  const grand = rows.reduce((a, r) => a + r.total, 0)

  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: s.surface }}>
            {['Estratégia', 'Ativo', 'Lotes', 'Ops', 'Win Rate', 'Resultado', '% do total'].map((h, i) => (
              <th key={h} style={{ padding: '10px 14px', textAlign: i < 3 ? 'left' : 'right', fontWeight: 600, color: s.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${s.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pct = grand !== 0 ? (r.total / Math.abs(grand)) * 100 : 0
            return (
              <tr key={i} style={{ borderBottom: 'rgba(255,255,255,0.03) solid 1px' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '10px 14px', color: s.muted }}>{r.ativo}</td>
                <td style={{ padding: '10px 14px', color: s.muted }}>{r.lots}×</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: s.muted }}>{r.nOps || '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: r.wr >= 55 ? '#34d47e' : '#f5a623' }}>{r.nOps ? r.wr.toFixed(1)+'%' : '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: r.total >= 0 ? '#34d47e' : '#f06060' }}>{r.nOps ? fmt(r.total) : '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: pct >= 0 ? '#34d47e' : '#f06060' }}>{r.nOps ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `1px solid ${s.border}`, background: s.surface }}>
            <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, color: s.muted }}>Total</td>
            <td />
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: grand >= 0 ? '#34d47e' : '#f06060' }}>{fmt(grand)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function PortfolioDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { robots, portfolios, loading } = useData()
  const [tab, setTab] = useState('Visão Geral')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!robots.length || !portfolios.length) return
    try {
      const p = portfolios.find(p => p.id === parseInt(id))
      if (!p) { setError('Portfólio não encontrado'); return }

      const cfg = typeof p.robots_config === 'string' ? JSON.parse(p.robots_config) : (p.robots_config || {})
      const list = Array.isArray(cfg) ? cfg : (cfg.robots || [])
      const multiplier = cfg.multiplier || 1

      const entries = list.map(({ robotId, lots }) => {
        const r = robots.find(rb => rb.id === robotId)
        if (!r || !r.operations?.length) return null
        const adj = buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest')
        return { robot: r, lots, adjOps: adj }
      }).filter(Boolean)

      if (!entries.length) { setError('Sem estratégias com dados'); return }

      const timeline = buildPortfolioTimeline(entries)
      const m = calcPortfolioMetrics(timeline, multiplier)

      const monthly = {}
      timeline.forEach(op => {
        const pts = (op.abertura || '').split(' ')[0].split('/')
        if (pts.length === 3) {
          const key = `${pts[2]}-${pts[1]}`
          monthly[key] = (monthly[key] || 0) + (op.res_op || 0)
        }
      })
      const vals = Object.values(monthly)
      m.avgMonthly = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      m.nMonths = vals.length

      setData({ portfolio: p, entries, metrics: m, timeline })
    } catch (e) {
      console.error(e)
      setError('Erro ao calcular métricas: ' + e.message)
    }
  }, [robots, portfolios, id])

  const TABS = ['Visão Geral', 'Mensal', 'Estratégias']

  if (loading) return (
    <div style={{ background: s.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted }}>
      Carregando...
    </div>
  )

  if (error) return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text, padding: 40 }}>
      <button onClick={() => navigate('/portfolios-recomendados')} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Voltar</button>
      <div style={{ color: '#f06060' }}>{error}</div>
    </div>
  )

  if (!data) return (
    <div style={{ background: s.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted }}>
      Calculando...
    </div>
  )

  const { portfolio, entries, metrics, timeline } = data

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>

        <button onClick={() => navigate('/portfolios-recomendados')}
          style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Voltar aos portfólios
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{portfolio.name}</h1>
          <div style={{ display: 'flex', gap: 20, color: s.muted, fontSize: 13, flexWrap: 'wrap' }}>
            <span>{entries.length} estratégias</span>
            <span>{timeline.length.toLocaleString('pt-BR')} operações</span>
            <span>{metrics.nMonths} meses</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${s.border}`, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', padding: '9px 18px', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? s.accent : s.muted, borderBottom: tab === t ? `2px solid ${s.accent}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1, transition: 'color .15s' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Visão Geral' && <VisaoGeralTab portfolio={portfolio} entries={entries} metrics={metrics} timeline={timeline} />}
        {tab === 'Mensal' && <MensalTab timeline={timeline} />}
        {tab === 'Estratégias' && <EstrategiasTab entries={entries} />}

        <div style={{ marginTop: 36, padding: '24px', background: `${s.accent}0d`, border: `1px solid ${s.accent}33`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Quer operar o {portfolio.name}?</div>
            <div style={{ fontSize: 13, color: s.muted }}>Entre em contato para saber como começar.</div>
          </div>
          <a href={`https://wa.me/5553999793260?text=${encodeURIComponent(`Olá! Tenho interesse no portfólio ${portfolio.name} do Método 6015.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: s.accent, color: '#000', padding: '12px 24px', borderRadius: 8, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
            💬 Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
