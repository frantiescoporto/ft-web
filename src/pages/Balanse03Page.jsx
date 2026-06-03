import React, { useMemo } from 'react'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, calcMetrics, fmtNum } from '../lib/analytics.js'

/* ===================================================================
 *  COMBO BALANSE_03  ·  Landing de venda
 *  Os números de performance são puxados AO VIVO dos robôs reais
 *  (ids abaixo) — nada é digitado à mão.
 * =================================================================== */

const COMBO_IDS = [17, 116, 25]

// Link de contratação na Nelogica
const LINK_NELOGICA = 'https://nelogica.com.br/invitechat?group=4F5557374A545239'

// >>> EDITE AQUI os planos (espelham a página da Nelogica) <<<
const PLANOS = [
  { nome: 'Mensal', preco: 'Grátis', total: 'Contratação gratuita', badge: '100% OFF', gratis: true },
  { nome: 'Semestral', preco: 'R$ 269,01', total: 'Total R$ 1.614,06', badge: '10% OFF' },
  { nome: 'Anual', preco: 'R$ 254,07', total: 'Total R$ 3.048,78', badge: '15% OFF' },
  { nome: 'Bienal', preco: 'R$ 224,17', total: 'Total R$ 5.380,20', badge: '25% OFF', destaque: true, tag: 'Melhor opção' },
]

const s = {
  accent: '#00d4aa', accent2: '#34d47e',
  dark: '#080c12', surface: '#0f1520', card: '#131b28',
  border: 'rgba(255,255,255,0.08)', text: '#e8edf5', muted: '#8b97ad',
}

function fmtR(v) {
  if (v == null || isNaN(v)) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* calcula as métricas de um robô do mesmo jeito que a grade de Estratégias */
function metricsForRobot(r) {
  if (!r || !r.operations?.length) return null
  const adj = buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest')
  const m = calcMetrics(adj)
  const monthly = {}
  adj.forEach(o => {
    const p = (o.abertura || '').split(' ')[0].split('/')
    if (p.length === 3) { const k = `${p[2]}-${p[1]}`; monthly[k] = (monthly[k] || 0) + o.resAdj }
  })
  const vals = Object.values(monthly)
  const avgMonthly = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  let avgMonthlyReal = null, nMonthsReal = 0
  if (r.realOps?.length) {
    const rm = {}
    r.realOps.forEach(o => {
      const p = (o.abertura || '').split(' ')[0].split('/')
      if (p.length === 3) { const k = `${p[2]}-${p[1]}`; rm[k] = (rm[k] || 0) + (o.res_op || 0) }
    })
    const rv = Object.values(rm)
    avgMonthlyReal = rv.length ? rv.reduce((a, b) => a + b, 0) / rv.length : null
    nMonthsReal = rv.length
  }
  return { r, m, avgMonthly, avgMonthlyReal, nMonthsReal, nOps: adj.length }
}

function CTA({ children, big }) {
  return (
    <a href={LINK_NELOGICA} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-block', background: s.accent, color: '#04140f',
        fontWeight: 900, textDecoration: 'none', borderRadius: 12,
        padding: big ? '18px 40px' : '14px 28px', fontSize: big ? 19 : 15,
        boxShadow: '0 10px 30px rgba(0,212,170,0.25)', letterSpacing: .2,
      }}>
      {children}
    </a>
  )
}

export default function Balanse03Page() {
  const { robots, loading } = useData()

  const combo = useMemo(() => {
    const items = COMBO_IDS
      .map(id => robots.find(r => r.id === Number(id)))
      .map(metricsForRobot)
      .filter(Boolean)
    const somaBT = items.reduce((a, it) => a + (it.avgMonthly || 0), 0)
    const temTodosReais = items.length > 0 && items.every(it => it.avgMonthlyReal != null)
    const somaReal = temTodosReais ? items.reduce((a, it) => a + it.avgMonthlyReal, 0) : null
    return { items, somaBT, somaReal }
  }, [robots])

  const wrap = { background: s.dark, color: s.text, minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }
  const section = { maxWidth: 1100, margin: '0 auto', padding: '0 22px' }
  const h2 = { fontSize: 28, fontWeight: 900, textAlign: 'center', margin: '0 0 8px' }
  const sub = { color: s.muted, textAlign: 'center', maxWidth: 620, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.6 }

  return (
    <div style={wrap}>

      {/* ---------------- HERO ---------------- */}
      <div style={{ background: `radial-gradient(1000px 500px at 50% -10%, rgba(0,212,170,0.16), transparent), ${s.dark}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={{ ...section, padding: '64px 22px 56px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: s.accent, border: `1px solid ${s.accent}`, borderRadius: 999, padding: '6px 14px', marginBottom: 22 }}>
            COMBO BALANSE_03 · MÉTODO 6015
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.08, margin: '0 0 18px' }}>
            3 robôs operando por você.<br />
            <span style={{ color: s.accent }}>Comece hoje, de graça.</span>
          </h1>
          <p style={{ color: s.muted, fontSize: 18, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 30px' }}>
            Uma carteira automatizada com 3 estratégias do Método 6015 + o módulo de automação pra você rodar sozinho.
            <strong style={{ color: s.text }}> Contratação gratuita e 30 dias grátis.</strong> Não curtiu? Cancela e não paga nada.
          </p>
          <CTA big>QUERO TESTAR 30 DIAS GRÁTIS →</CTA>
          <div style={{ color: s.muted, fontSize: 13, marginTop: 16 }}>
            Contratação gratuita · 30 dias grátis · Cancele quando quiser
          </div>
        </div>
      </div>

      {/* ---------------- O QUE ESTÁ INCLUSO ---------------- */}
      <div style={{ padding: '56px 0' }}>
        <div style={section}>
          <h2 style={h2}>O que você leva no combo</h2>
          <p style={sub}>Tudo pronto pra colocar pra rodar — sem precisar saber programar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { t: '3 robôs do Método 6015', d: 'As 3 estratégias do combo, prontas pra operar no seu Profit.' },
              { t: 'Módulo de automação Basic', d: 'Os robôs operam sozinhos por você — você só acompanha.' },
              { t: '30 dias grátis', d: 'Roda tudo no seu ambiente antes de decidir pagar qualquer coisa.' },
              { t: 'Cancela quando quiser', d: 'Sem fidelidade. Não gostou, cancela e não paga.' },
            ].map((c, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 22 }}>
                <div style={{ color: s.accent, fontSize: 22, marginBottom: 10 }}>✓</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{c.t}</div>
                <div style={{ color: s.muted, fontSize: 14, lineHeight: 1.55 }}>{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- NÚMEROS REAIS ---------------- */}
      <div style={{ background: s.surface, padding: '56px 0', borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={section}>
          <h2 style={h2}>Os números, sem maquiagem</h2>
          <p style={sub}>
            Dados reais dos 3 robôs do combo. Clique em qualquer um para ver a análise completa — incluindo drawdown e resultados de conta real.
          </p>

          {loading ? (
            <p style={{ textAlign: 'center', color: s.muted }}>Carregando dados dos robôs…</p>
          ) : combo.items.length === 0 ? (
            <p style={{ textAlign: 'center', color: s.muted }}>Dados dos robôs indisponíveis no momento.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {combo.items.map(({ r, m, avgMonthly, avgMonthlyReal, nMonthsReal, nOps }) => (
                  <a key={r.id} href={`/estrategias/${r.id}`}
                    style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 20, textDecoration: 'none', color: s.text, display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</span>
                      {r.strategy_type && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(155,124,244,0.12)', color: '#9b7cf4', fontWeight: 700 }}>{r.strategy_type}</span>
                      )}
                      {r.realOps?.length > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(52,212,126,0.12)', color: s.accent2, fontWeight: 700 }}>Conta real</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { l: 'M.6015', v: fmtNum(m.m6015 || 0) },
                        { l: 'Taxa de acerto', v: `${(m.winRate || 0).toFixed(0)}%` },
                        { l: 'Fator de lucro', v: fmtNum(m.profitFactor || 0) },
                        { l: 'Méd. backtest/mês', v: fmtR(avgMonthly) },
                      ].map((st, i) => (
                        <div key={i} style={{ background: s.surface, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: s.muted, marginBottom: 2 }}>{st.l}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: s.accent2 }}>{st.v}</div>
                        </div>
                      ))}
                    </div>
                    {avgMonthlyReal != null && (
                      <div style={{ marginTop: 8, fontSize: 12, color: s.muted, textAlign: 'center' }}>
                        Média real ({nMonthsReal}m): <strong style={{ color: avgMonthlyReal >= 0 ? s.accent2 : '#f06060' }}>{fmtR(avgMonthlyReal)}</strong>
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontSize: 12, color: s.accent, fontWeight: 700 }}>Ver análise completa →</div>
                  </a>
                ))}
              </div>

              {/* headline combinado */}
              <div style={{ marginTop: 22, background: s.card, border: `1px solid ${s.accent}`, borderRadius: 14, padding: '22px 20px', textAlign: 'center' }}>
                {combo.somaReal != null ? (
                  <>
                    <div style={{ color: s.muted, fontSize: 13, marginBottom: 4 }}>
                      Média mensal somada dos 3 robôs · conta real, 1 contrato cada
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: s.accent }}>{fmtR(combo.somaReal)}<span style={{ fontSize: 16, color: s.muted, fontWeight: 600 }}>/mês</span></div>
                    <div style={{ marginTop: 6, fontSize: 13, color: s.muted }}>
                      Em backtest, a média somada é de <strong style={{ color: s.text }}>{fmtR(combo.somaBT)}/mês</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: s.muted, fontSize: 13, marginBottom: 4 }}>
                      Média mensal somada dos 3 robôs · backtest, 1 contrato cada
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: s.accent }}>{fmtR(combo.somaBT)}<span style={{ fontSize: 16, color: s.muted, fontWeight: 600 }}>/mês</span></div>
                    <div style={{ marginTop: 6, fontSize: 12, color: s.muted }}>
                      Os valores de conta real de cada robô aparecem nos cards acima.
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <div style={{ padding: '56px 0' }}>
        <div style={section}>
          <h2 style={h2}>Como começar (leva minutos)</h2>
          <p style={sub}>Sem burocracia. Você contrata grátis e já sai operando.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { n: '1', t: 'Contrate grátis', d: 'Clique no botão e faça a contratação gratuita pela Nelogica.' },
              { n: '2', t: 'Ative os robôs', d: 'Os 3 robôs + módulo de automação vão pro seu Profit, prontos pra rodar.' },
              { n: '3', t: 'Rode 30 dias e decida', d: 'Acompanha os resultados no seu ambiente. Continua só se fizer sentido pra você.' },
            ].map((c) => (
              <div key={c.n} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,212,170,0.12)', color: s.accent, fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{c.n}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{c.t}</div>
                <div style={{ color: s.muted, fontSize: 14, lineHeight: 1.55 }}>{c.d}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <CTA big>COMEÇAR AGORA — É GRÁTIS →</CTA>
          </div>
        </div>
      </div>

      {/* ---------------- PLANOS ---------------- */}
      <div style={{ padding: '56px 0', borderTop: `1px solid ${s.border}` }}>
        <div style={section}>
          <h2 style={h2}>Comece grátis. Continue se valer a pena.</h2>
          <p style={sub}>
            Você entra pelo plano mensal gratuito e roda 30 dias sem pagar nada. Se decidir ficar, trava um preço melhor nos planos mais longos.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'stretch' }}>
            {PLANOS.map((p, i) => (
              <div key={i} style={{
                position: 'relative', background: s.card,
                border: `1px solid ${p.destaque ? s.accent : s.border}`,
                borderRadius: 14, padding: '24px 20px', textAlign: 'center',
                boxShadow: p.destaque ? '0 12px 34px rgba(0,212,170,0.18)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {p.tag && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: s.accent, color: '#04140f', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>{p.tag}</div>
                )}
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{p.nome}</div>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: s.accent, border: `1px solid ${s.accent}`, borderRadius: 999, padding: '3px 10px', marginBottom: 14 }}>{p.badge}</span>
                <div style={{ fontSize: p.gratis ? 30 : 26, fontWeight: 900, color: p.gratis ? s.accent : s.text }}>
                  {p.preco}{!p.gratis && <span style={{ fontSize: 13, color: s.muted, fontWeight: 600 }}>/mês</span>}
                </div>
                <div style={{ fontSize: 12, color: s.muted, marginTop: 4, marginBottom: 20 }}>{p.total}</div>
                <a href={LINK_NELOGICA} target="_blank" rel="noopener noreferrer"
                  style={{ marginTop: 'auto', display: 'block', textDecoration: 'none', fontWeight: 800, fontSize: 14, padding: '12px', borderRadius: 10,
                    background: p.destaque || p.gratis ? s.accent : 'transparent',
                    color: p.destaque || p.gratis ? '#04140f' : s.text,
                    border: p.destaque || p.gratis ? 'none' : `1px solid ${s.border}` }}>
                  {p.gratis ? 'Começar grátis' : 'Escolher plano'}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: s.muted, fontSize: 12, marginTop: 18 }}>
            Todos os planos incluem os 3 robôs + módulo de automação Basic. A escolha do plano é feita na própria Nelogica.
          </p>
        </div>
      </div>

      {/* ---------------- FAQ ---------------- */}
      <div style={{ background: s.surface, padding: '56px 0', borderTop: `1px solid ${s.border}` }}>
        <div style={{ ...section, maxWidth: 760 }}>
          <h2 style={h2}>Perguntas rápidas</h2>
          <div style={{ marginTop: 28 }}>
            {[
              { q: 'Preciso pagar alguma coisa agora?', a: 'Não. A contratação é gratuita e você tem 30 dias grátis pra testar tudo no seu ambiente.' },
              { q: 'E depois dos 30 dias?', a: 'Você começa no plano mensal gratuito (100% OFF) e roda 30 dias sem pagar nada. Se decidir continuar, pode travar um preço melhor nos planos semestral, anual ou bienal — o bienal sai por R$ 224,17/mês (25% OFF). Cancela quando quiser, sem fidelidade.' },
              { q: 'Em qual plataforma funciona?', a: 'No Profit (Nelogica). Os robôs e o módulo de automação rodam direto na plataforma, sem você precisar programar nada.' },
              { q: 'Consigo cancelar fácil?', a: 'Sim, sem fidelidade. Se não fizer sentido pra você, é só cancelar dentro do período gratuito e você não paga nada.' },
            ].map((f, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${s.border}`, padding: '18px 0' }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{f.q}</div>
                <div style={{ color: s.muted, fontSize: 14, lineHeight: 1.6 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- CTA FINAL ---------------- */}
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <div style={section}>
          <h2 style={{ ...h2, fontSize: 'clamp(26px,5vw,38px)' }}>Testar não custa nada. Não testar pode custar a próxima alta.</h2>
          <p style={sub}>3 robôs + automação, rodando por você. 30 dias grátis pra ver com os próprios olhos.</p>
          <CTA big>QUERO MEUS 30 DIAS GRÁTIS →</CTA>
        </div>
      </div>

      {/* ---------------- DISCLAIMER ---------------- */}
      <div style={{ borderTop: `1px solid ${s.border}`, padding: '28px 0' }}>
        <div style={{ ...section, maxWidth: 820 }}>
          <p style={{ color: s.muted, fontSize: 11.5, lineHeight: 1.6, textAlign: 'center', margin: 0 }}>
            Operações com contratos futuros e derivativos envolvem risco de perda, inclusive superior ao capital investido.
            Resultados passados, reais ou simulados, não constituem garantia de resultados futuros. Os números exibidos referem-se
            a backtests e/ou operações em conta real das estratégias citadas e podem variar conforme execução, custos e condições
            de mercado. O conteúdo desta página é de caráter informativo e não constitui recomendação, consultoria ou oferta de
            valores mobiliários. Frantiesco Trader · Método 6015.
          </p>
        </div>
      </div>

    </div>
  )
}
