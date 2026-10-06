import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

/* ============================================================================
 *  Campanha: Carteira IA x Minha Carteira — rota /ia-vs-carteira
 *  Duas carteiras de R$ 15.000 com as MESMAS estratégias (robôs do Frantiesco).
 *  A IA montou a dela só com dados; o Frantiesco montou a sua com dados +
 *  experiência. Resultado dia a dia e mês a mês desde 01/10/2026.
 *  Objetivo: vender a Mentoria 6015.
 *  Fonte: planilha RESULTADOS DIÁRIOS (por contrato) × lotes de cada carteira.
 * ========================================================================== */

const CAP = 15000               // base das duas carteiras
const DATA_INICIO = '2026-10-01' // compara a partir daqui
const LINK_MENTORIA = '/mentoria_metodo6015'

const PLANILHA_ID = '1emn2ZOD1yN8CgMPp1jrnujTqXNoBOPJ_F7z3MOADQk4'
const FONTES_CSV = [
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv`,
]

// Composição das carteiras (robô: lotes). Vindo do TQL.
const LOTES_IA = { WIN_16:2, WDO_34:1, WIN_27:2, WIN_36:5, WIN_07:2, WIN_22:3, WIN_38:3, WIN_02:1, WIN_10:2, WIN_41:2, WIN_84:6, WIN_29:3, WIN_87:2, BIT_56:3, WIN_14:2, WIN_39:3, WIN_13:1, BIT_55:5 }
const LOTES_MINHA = { WIN_10:3, WIN_22:2, WDO_34:1, WIN_36:6, WIN_06:4, WIN_07:3, WIN_71:4, WIN_38:3, WIN_02:1, WDO_05:3, WIN_27:3, WIN_41:2, WIN_16:2, WIN_85:1, WIN_84:2 }
const N_IA = Object.keys(LOTES_IA).length
const N_MINHA = Object.keys(LOTES_MINHA).length
const CONTR_IA = Object.values(LOTES_IA).reduce((a, b) => a + b, 0)
const CONTR_MINHA = Object.values(LOTES_MINHA).reduce((a, b) => a + b, 0)

/* ── CSV + helpers ── */
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' }
    else if (c !== '\r') f += c
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row) }
  return rows
}
const EH_DATA = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
function isoDe(s) { const m = EH_DATA.exec(String(s).trim()); if (!m) return null; const [, d, mo, y] = m; const yy = y.length === 2 ? '20' + y : y; return `${yy}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}` }
function toNum(v) {
  let t = String(v == null ? '' : v).replace('R$', '').replace('−', '-').trim()
  if (!t) return 0
  const neg = t.indexOf('-') >= 0 || /^\(.*\)$/.test(t)
  t = t.replace(/[^0-9.,]/g, ''); if (!t) return 0
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t); if (!isFinite(n)) return 0
  return neg ? -Math.abs(n) : n
}
const fmtBRL = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtPct = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
const MESNOME = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default function IAvsCarteiraPage() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null) // {dias:[{iso,label}], robo:{nome:{iso:valor}}}
  const [estado, setEstado] = useState('carregando') // carregando | ok | erro

  useEffect(() => {
    const id = 'iavs-fonts'
    if (!document.getElementById(id)) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      for (const url of FONTES_CSV) {
        try {
          const r = await fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cb=' + Date.now())
          if (!r.ok) continue
          const rows = parseCSV(await r.text()).filter(x => x.some(c => String(c).trim() !== ''))
          if (rows.length < 2) continue
          const cab = rows[0]
          const cols = cab.map((c, i) => ({ i, iso: isoDe(c) })).filter(c => c.iso && c.iso >= DATA_INICIO)
          if (!cols.length) continue
          cols.sort((a, b) => a.iso.localeCompare(b.iso))
          const dias = cols.map(c => {
            const [y, m, d] = c.iso.split('-')
            return { iso: c.iso, i: c.i, label: `${d}/${m}`, mes: `${y}-${m}` }
          })
          const robo = {}
          rows.slice(1).forEach(x => {
            const nome = String(x[0] || '').trim()
            if (!nome || /^https?:/i.test(nome) || !/^(WIN|WDO|BIT)/.test(nome)) return
            const mapa = {}
            cols.forEach(c => { mapa[c.iso] = toNum(x[c.i]) })
            robo[nome] = mapa
          })
          if (vivo) { setDados({ dias, robo }); setEstado('ok') }
          return
        } catch { /* próxima fonte */ }
      }
      if (vivo) setEstado('erro')
    })()
    return () => { vivo = false }
  }, [])

  const calc = useMemo(() => {
    if (!dados) return null
    const somaPort = (lotes, iso) => Object.entries(lotes).reduce((a, [r, l]) => a + (dados.robo[r]?.[iso] || 0) * l, 0)
    let accIA = 0, accMI = 0
    const linhas = dados.dias.map(d => {
      const ia = somaPort(LOTES_IA, d.iso), mi = somaPort(LOTES_MINHA, d.iso)
      accIA += ia; accMI += mi
      return { ...d, ia, mi, accIA, accMI }
    })
    // meses
    const mesesMap = {}
    linhas.forEach(l => { (mesesMap[l.mes] = mesesMap[l.mes] || { ia: 0, mi: 0, mes: l.mes }); mesesMap[l.mes].ia += l.ia; mesesMap[l.mes].mi += l.mi })
    const meses = Object.values(mesesMap).sort((a, b) => a.mes.localeCompare(b.mes))
    const totIA = accIA, totMI = accMI
    // robôs do portfólio ausentes na planilha (aviso interno)
    const faltam = [...new Set([...Object.keys(LOTES_IA), ...Object.keys(LOTES_MINHA)])].filter(r => !dados.robo[r])
    return { linhas, meses, totIA, totMI, faltam }
  }, [dados])

  useEffect(() => {
    const els = document.querySelectorAll('.iv .reveal')
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .14 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [calc])

  const go = (to) => (e) => { e.preventDefault(); navigate(to) }
  const lideraMinha = calc && calc.totMI >= calc.totIA

  return (
    <div className="iv">
      <style>{CSS}</style>

      <nav className="iv-nav">
        <button onClick={() => navigate('/')} className="iv-back">← Início</button>
        <span className="iv-brand">Frantiesco <span>Trader</span></span>
      </nav>

      {/* HERO */}
      <section className="iv-hero">
        <div className="iv-glow" />
        <div className="iv-in">
          <div className="iv-eyebrow">Experimento ao vivo · Método 6015</div>
          <h1 className="iv-h1">A Inteligência Artificial<br /><span className="g">contra a do mentor.</span></h1>
          <p className="iv-lede">
            Duas carteiras de <b>R$ 15.000</b>, as <b>mesmas estratégias</b> — os meus robôs. A IA montou a dela
            sozinha, só com os dados. Eu montei a minha com os mesmos dados <b>mais a experiência de quem
            opera isso de verdade</b>. A partir de 01/10/2026, acompanhe dia a dia quem decide melhor.
          </p>
          <div className="iv-cta">
            <a className="iv-btn grad" href={LINK_MENTORIA} onClick={go(LINK_MENTORIA)}>Quero aprender na Mentoria 6015</a>
          </div>
        </div>
      </section>

      {/* PLACAR */}
      <section className="iv-sec">
        <div className="iv-wrap">
          {estado === 'carregando' && <div className="iv-load">Carregando resultados…</div>}
          {estado === 'erro' && <div className="iv-load">Não consegui carregar os resultados agora. Tente recarregar a página.</div>}
          {estado === 'ok' && calc && (
            <>
              <div className="iv-placar reveal">
                <div className={`iv-score ia ${!lideraMinha ? 'lead' : ''}`}>
                  <div className="iv-score-tag">🤖 Carteira da IA</div>
                  <div className="iv-score-sub">{N_IA} estratégias · {CONTR_IA} contratos</div>
                  <div className={`iv-score-val ${calc.totIA >= 0 ? 'pos' : 'neg'}`}>{fmtBRL(calc.totIA)}</div>
                  <div className={`iv-score-pct ${calc.totIA >= 0 ? 'pos' : 'neg'}`}>{fmtPct(calc.totIA / CAP * 100)} sobre 15k</div>
                </div>
                <div className="iv-vs">VS</div>
                <div className={`iv-score minha ${lideraMinha ? 'lead' : ''}`}>
                  <div className="iv-score-tag">🧠 Minha Carteira</div>
                  <div className="iv-score-sub">{N_MINHA} estratégias · {CONTR_MINHA} contratos</div>
                  <div className={`iv-score-val ${calc.totMI >= 0 ? 'pos' : 'neg'}`}>{fmtBRL(calc.totMI)}</div>
                  <div className={`iv-score-pct ${calc.totMI >= 0 ? 'pos' : 'neg'}`}>{fmtPct(calc.totMI / CAP * 100)} sobre 15k</div>
                </div>
              </div>
              <p className="iv-placar-leg reveal">Acumulado desde 01/10/2026 · atualiza conforme os resultados do dia são lançados</p>

              {/* GRÁFICO acumulado */}
              <div className="iv-card reveal">
                <div className="iv-card-h"><span>Curva acumulada</span><span className="iv-leg"><i className="dot minha" />Minha <i className="dot ia" />IA</span></div>
                <Grafico linhas={calc.linhas} />
              </div>

              {/* DIA A DIA */}
              <div className="iv-card reveal">
                <div className="iv-card-h"><span>Dia a dia</span><span className="iv-leg-min">resultado do dia</span></div>
                <div className="iv-tab">
                  <div className="iv-tr iv-th"><span>Data</span><span>🤖 IA</span><span>🧠 Minha</span><span>Dia</span></div>
                  {calc.linhas.map(l => (
                    <div className="iv-tr" key={l.iso}>
                      <span className="iv-dia mono">{l.label}</span>
                      <span className={`mono ${l.ia > 0 ? 'pos' : l.ia < 0 ? 'neg' : 'zero'}`}>{l.ia === 0 ? '—' : fmtBRL(l.ia)}</span>
                      <span className={`mono ${l.mi > 0 ? 'pos' : l.mi < 0 ? 'neg' : 'zero'}`}>{l.mi === 0 ? '—' : fmtBRL(l.mi)}</span>
                      <span className="iv-win">{l.ia === l.mi ? '=' : (l.mi > l.ia ? '🧠' : '🤖')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MÊS A MÊS */}
              <div className="iv-card reveal">
                <div className="iv-card-h"><span>Mês a mês</span></div>
                <div className="iv-tab">
                  <div className="iv-tr iv-th"><span>Mês</span><span>🤖 IA</span><span>🧠 Minha</span><span>Dif.</span></div>
                  {calc.meses.map(m => {
                    const [y, mm] = m.mes.split('-'); const dif = m.mi - m.ia
                    return (
                      <div className="iv-tr" key={m.mes}>
                        <span className="iv-dia">{MESNOME[+mm - 1]}/{y.slice(2)}</span>
                        <span className={`mono ${m.ia >= 0 ? 'pos' : 'neg'}`}>{fmtBRL(m.ia)}<small>{' '}{fmtPct(m.ia / CAP * 100)}</small></span>
                        <span className={`mono ${m.mi >= 0 ? 'pos' : 'neg'}`}>{fmtBRL(m.mi)}<small>{' '}{fmtPct(m.mi / CAP * 100)}</small></span>
                        <span className={`mono ${dif >= 0 ? 'pos' : 'neg'}`}>{fmtBRL(dif)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="iv-nota">A coluna "Dif." é o quanto a minha carteira fez a mais (ou a menos) que a da IA no mês.</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* PREMISSA */}
      <section className="iv-sec alt"><div className="iv-wrap">
        <div className="reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 30px' }}>
          <div className="iv-kick" style={{ justifyContent: 'center' }}>A regra do jogo</div>
          <h2 className="iv-h2" style={{ textAlign: 'center' }}>Mesmas armas. Cabeças diferentes.</h2>
        </div>
        <div className="iv-duo reveal">
          <div className="iv-col">
            <div className="iv-col-t">🤖 Carteira da IA</div>
            <p>Recebeu o histórico completo das minhas estratégias e montou a carteira de 15k sozinha, otimizando pelos números. Sem viés, sem medo — e sem experiência de mercado.</p>
          </div>
          <div className="iv-col destaque">
            <div className="iv-col-t">🧠 Minha Carteira</div>
            <p>Mesmos dados, mesmas estratégias. Mas eu leio o que o número não mostra: regime de mercado, correlação entre robôs, quando um setup cansa. É o que ensino na Mentoria 6015.</p>
          </div>
        </div>
        <p className="iv-premissa-nota reveal">As duas podem usar qualquer uma das estratégias que eu criei. A diferença não está nas ferramentas — está em como cada uma decide usá-las.</p>
      </div></section>

      {/* CTA FINAL */}
      <section className="iv-final reveal">
        <h2>Dados qualquer um tem. Critério se aprende.</h2>
        <p>Na Mentoria 6015 você aprende a montar e gerir carteiras de robôs com o método que está sendo testado aqui, ao vivo.</p>
        <a className="iv-btn grad big" href={LINK_MENTORIA} onClick={go(LINK_MENTORIA)}>Conhecer a Mentoria 6015</a>
      </section>

      <footer className="iv-foot">
        <div>Frantiesco Trader · Método 6015</div>
        <div className="r">Comparativo com capital de R$ 15.000 por carteira, resultado por contrato das estratégias multiplicado pelos lotes de cada carteira. Resultados passados não garantem retornos futuros. Operar derivativos envolve risco, inclusive de perda.</div>
      </footer>
    </div>
  )
}

/* ── Gráfico de curva acumulada (SVG) ── */
function Grafico({ linhas }) {
  if (!linhas || !linhas.length) return null
  const W = 720, H = 240, P = 28
  const xs = linhas.length === 1 ? [P, W - P] : linhas.map((_, i) => P + (W - 2 * P) * i / (linhas.length - 1))
  const valores = linhas.flatMap(l => [l.accIA, l.accMI]).concat([0])
  let min = Math.min(...valores), max = Math.max(...valores)
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.12; min -= pad; max += pad
  const y = (v) => H - P - (v - min) / (max - min) * (H - 2 * P)
  const pts = (key) => linhas.map((l, i) => `${(linhas.length === 1 ? xs[1] : xs[i]).toFixed(1)},${y(l[key]).toFixed(1)}`).join(' ')
  const y0 = y(0)
  return (
    <svg className="iv-graf" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Curva acumulada das duas carteiras">
      <line x1={P} y1={y0} x2={W - P} y2={y0} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />
      <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts('accIA')} opacity="0.9" />
      <polyline fill="none" stroke="url(#ivgrad)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pts('accMI')} />
      {linhas.map((l, i) => (
        <g key={l.iso}>
          <circle cx={linhas.length === 1 ? xs[1] : xs[i]} cy={y(l.accMI)} r="3.2" fill="#00E0B8" />
          <circle cx={linhas.length === 1 ? xs[1] : xs[i]} cy={y(l.accIA)} r="2.6" fill="var(--gold)" />
        </g>
      ))}
      <defs>
        <linearGradient id="ivgrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E0B8" /><stop offset="55%" stopColor="#38C6FF" /><stop offset="100%" stopColor="#5B8CFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const CSS = `
.iv{ --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF; --pos:#37E29B; --neg:#FF6B6B; --gold:#FFC53D;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.iv .mono{ font-family:'Geist Mono','SF Mono',monospace; font-variant-numeric:tabular-nums; }
.iv-wrap{ max-width:860px; margin:0 auto; padding:0 22px; }
.iv a{ color:inherit; text-decoration:none; }
.iv .pos{ color:var(--pos); } .iv .neg{ color:var(--neg); } .iv .zero{ color:var(--muted); }

.iv-nav{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
  padding:13px 22px; background:rgba(6,8,9,.65); backdrop-filter:saturate(160%) blur(16px); border-bottom:1px solid var(--line); }
.iv-back{ background:none; border:none; color:var(--muted); cursor:pointer; font-size:14px; font-family:inherit; }
.iv-brand{ font-weight:600; font-size:15px; letter-spacing:-.02em; }
.iv-brand span{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }

.iv-hero{ position:relative; text-align:center; padding:72px 22px 44px; }
.iv-glow{ position:absolute; left:50%; top:10px; width:820px; height:440px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(0,224,184,.24), rgba(56,198,255,.12) 45%, transparent 72%); filter:blur(26px); z-index:0; }
.iv-in{ position:relative; z-index:2; max-width:760px; margin:0 auto; }
.iv-eyebrow{ font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:16px; }
.iv-h1{ font-weight:600; font-size:clamp(34px,6.5vw,66px); line-height:1; letter-spacing:-.04em; margin:0 0 18px; }
.iv-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.iv-lede{ color:var(--muted); font-size:17px; line-height:1.6; max-width:56ch; margin:0 auto 26px; }
.iv-lede b{ color:var(--text); font-weight:600; }
.iv-cta{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.iv-btn{ font-weight:600; font-size:16px; padding:15px 28px; border-radius:999px; cursor:pointer; display:inline-block; transition:transform .12s; }
.iv-btn.grad{ background:var(--grad); color:#04140f; box-shadow:0 12px 40px rgba(0,224,184,.24); }
.iv-btn.grad:hover{ transform:translateY(-2px); }
.iv-btn.big{ font-size:18px; padding:18px 40px; }

.iv-sec{ padding:40px 0 20px; }
.iv-sec.alt{ padding:84px 0; background:rgba(255,255,255,.015); border-top:1px solid var(--line); border-bottom:1px solid var(--line); margin-top:40px; }
.iv-load{ text-align:center; color:var(--muted); padding:48px 0; }
.iv-kick{ display:flex; font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--cyanA); margin-bottom:14px; }
.iv-h2{ font-weight:600; font-size:clamp(24px,4vw,40px); letter-spacing:-.035em; line-height:1.08; margin:0; }

/* placar */
.iv-placar{ display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch; gap:14px; }
.iv-score{ background:var(--glass); border:1px solid var(--line); border-radius:20px; padding:22px; text-align:center; transition:border-color .2s, transform .2s; }
.iv-score.lead{ transform:translateY(-4px); }
.iv-score.minha.lead{ border-color:rgba(0,224,184,.5); box-shadow:0 20px 60px rgba(0,224,184,.14); }
.iv-score.ia.lead{ border-color:rgba(255,197,61,.5); box-shadow:0 20px 60px rgba(255,197,61,.12); }
.iv-score-tag{ font-weight:600; font-size:16px; }
.iv-score-sub{ color:var(--muted); font-size:12px; margin-top:4px; }
.iv-score-val{ font-family:'Geist Mono',monospace; font-weight:700; font-size:clamp(28px,6vw,42px); letter-spacing:-.02em; margin-top:14px; }
.iv-score-pct{ font-family:'Geist Mono',monospace; font-size:14px; margin-top:4px; }
.iv-vs{ display:flex; align-items:center; font-family:'Geist Mono',monospace; font-size:13px; color:var(--muted); letter-spacing:.1em; }
.iv-placar-leg{ text-align:center; color:var(--muted); font-size:12.5px; margin:14px 0 30px; }

/* cards */
.iv-card{ background:var(--glass); border:1px solid var(--line); border-radius:20px; padding:20px; margin-bottom:18px; backdrop-filter:blur(16px); }
.iv-card-h{ display:flex; align-items:center; justify-content:space-between; font-weight:600; font-size:15px; margin-bottom:14px; }
.iv-leg{ font-size:12px; color:var(--muted); font-weight:400; display:flex; align-items:center; gap:6px; }
.iv-leg-min{ font-size:12px; color:var(--muted); font-weight:400; }
.iv-leg .dot, .dot{ width:10px; height:10px; border-radius:50%; display:inline-block; }
.dot.minha{ background:#00E0B8; } .dot.ia{ background:var(--gold); margin-left:8px; }

.iv-graf{ width:100%; height:auto; display:block; }

/* tabela */
.iv-tab{ display:flex; flex-direction:column; }
.iv-tr{ display:grid; grid-template-columns:1fr 1fr 1fr 44px; align-items:center; gap:8px; padding:11px 6px; border-top:1px solid var(--line); font-size:14px; }
.iv-tr span:nth-child(2),.iv-tr span:nth-child(3){ text-align:right; }
.iv-tr span:nth-child(4){ text-align:center; }
.iv-th{ border-top:none; color:var(--muted); font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-family:'Geist Mono',monospace; }
.iv-dia{ color:var(--text); font-weight:500; }
.iv-tr small{ color:var(--muted); font-size:11px; }
.iv-win{ font-size:15px; }
.iv-nota,.iv-premissa-nota{ color:var(--muted); font-size:12.5px; margin:12px 2px 0; line-height:1.5; }
.iv-premissa-nota{ text-align:center; max-width:60ch; margin:26px auto 0; }

/* premissa */
.iv-duo{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.iv-col{ background:var(--glass); border:1px solid var(--line); border-radius:18px; padding:24px; }
.iv-col.destaque{ border-color:rgba(0,224,184,.4); background:linear-gradient(180deg, rgba(0,224,184,.06), transparent); }
.iv-col-t{ font-weight:600; font-size:18px; margin-bottom:10px; }
.iv-col p{ color:var(--muted); font-size:14.5px; line-height:1.6; margin:0; }

.iv-final{ text-align:center; padding:100px 22px; }
.iv-final h2{ font-weight:600; font-size:clamp(26px,4.5vw,44px); letter-spacing:-.035em; margin:0 0 12px; }
.iv-final p{ color:var(--muted); font-size:17px; margin:0 auto 26px; max-width:52ch; }
.iv-foot{ text-align:center; padding:38px 22px 60px; color:var(--muted); font-size:12px; border-top:1px solid var(--line); }
.iv-foot .r{ margin-top:8px; font-size:11px; max-width:70ch; margin-left:auto; margin-right:auto; line-height:1.5; }

.iv .reveal{ opacity:0; transform:translateY(26px); transition:opacity .7s ease, transform .7s ease; }
.iv .reveal.in{ opacity:1; transform:none; }
.iv a:focus-visible,.iv-btn:focus-visible,.iv-back:focus-visible{ outline:2px solid var(--cyanA); outline-offset:3px; }

@media (max-width:620px){
  .iv-placar{ grid-template-columns:1fr; }
  .iv-vs{ justify-content:center; padding:2px 0; }
  .iv-duo{ grid-template-columns:1fr; }
  .iv-tr{ grid-template-columns:1fr 1fr 1fr 32px; font-size:13px; }
}
@media (prefers-reduced-motion:reduce){ .iv .reveal{ opacity:1; transform:none; transition:none; } }
`
