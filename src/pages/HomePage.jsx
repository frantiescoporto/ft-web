import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, calcMetrics, fmtNum } from '../lib/analytics.js'
import { supabase } from '../lib/supabaseClient'

/* ============================================================================
 *  Home — Frantiesco Trader (identidade "Apple": dark cinematográfico)
 * ========================================================================== */

// Portfólio da aba Mentorados que alimenta a Home.
// A curva de capital e a rentabilidade média mensal saem os dois deste mesmo
// portfólio, calculados ao vivo. Nada aqui é digitado à mão.
const PORTFOLIO_HOME = 'PORTFOLIO PUBLICO'

// compara nomes ignorando acento, caixa e espaço sobrando
const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()

// Planilha oficial da Copa dos Robôs, lida ao vivo.
// Se o ranking não carregar no ar (o Google bloqueia o navegador por CORS quando a
// planilha está só compartilhada por link), abra a planilha em Arquivo > Compartilhar >
// Publicar na web > CSV e troque esta URL pela que o Google gerar.
const COPA_CSV = 'https://docs.google.com/spreadsheets/d/1bGEBfwfMAkWp0r_6ahWmGyntEd_Cen7QyxhxpyCm0Ns/gviz/tq?tqx=out:csv'
// reserva: último ranking exportado da planilha, mostrado com a data do snapshot
const COPA_SNAPSHOT = '/data/copa.json'

// foto tratada: coloque foto-trader-hero.png em ft-web/public/
const FOTO = '/foto-trader-hero.png'

const ddmmToInt = (s) => {
  const p = (s || '').split(' ')[0].split('/')
  return p.length === 3 ? Number(`${p[2]}${p[1]}${p[0]}`) : 0
}

const fmtPct1 = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'

/* ---------------------------------------------------------------------------
 *  Leitura do portfólio de mentorados, idêntica à da página Resultados:
 *  cada operação recebe os lotes da versão de configuração válida na data dela.
 * ------------------------------------------------------------------------- */
const opKey = (d) => {
  if (!d) return ''
  const p = d.split('/')
  const y = (p[2] || '').split(' ')[0].padStart(4, '0')
  return `${y}${(p[1] || '').padStart(2, '0')}${(p[0] || '').padStart(2, '0')}`
}

function parseRobots(json) {
  try {
    const p = JSON.parse(json || '[]')
    if (!p.length) return []
    if (typeof p[0] === 'string') return p.map(name => ({ name, lotes: 1 }))
    return p.map(r => ({ name: r.name || String(r), lotes: Number(r.lotes) || 1 }))
  } catch { return [] }
}

function getConfigVersions(p) {
  try {
    const cv = JSON.parse(p?.config_versions || '[]')
    if (cv.length) return cv
  } catch { /* cai no fallback */ }
  return [{ valid_from: null, robots_json: p?.robots_json || '[]' }]
}

function applyLotes(ops, versions) {
  if (!ops?.length || !versions?.length) return []
  const out = []
  for (const op of ops) {
    const k = opKey(op.abertura)
    const valid = versions
      .filter(v => !v.valid_from || String(v.valid_from) <= k)
      .sort((a, b) => String(b.valid_from || '').localeCompare(String(a.valid_from || '')))
    if (!valid.length) continue
    const map = {}
    parseRobots(valid[0].robots_json).forEach(r => { map[r.name] = r.lotes })
    const lotes = map[op.ativo]
    if (lotes === undefined) continue
    out.push({ abertura: op.abertura, res_op: (op.res_op || 0) * lotes })
  }
  return out.sort((a, b) => opKey(a.abertura).localeCompare(opKey(b.abertura)))
}

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/* resultado mês a mês, em % sobre o capital inicial do portfólio */
function serieMensal(ops, capital) {
  if (!ops.length || !capital) return null
  const acc = new Map()
  for (const o of ops) {
    const k = opKey(o.abertura).slice(0, 6)
    acc.set(k, (acc.get(k) || 0) + o.res_op)
  }
  if (!acc.size) return null
  const meses = [...acc.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      k,
      label: `${MES_CURTO[Number(k.slice(4, 6)) - 1]}/${k.slice(2, 4)}`,
      pct: (v / capital) * 100,
    }))
  return { meses, n: meses.length, pct: meses.reduce((t, m) => t + m.pct, 0) / meses.length }
}

/* CSV do Google Sheets: célula pode vir entre aspas e conter vírgula */
function parseCSV(text) {
  const rows = []
  let row = [], cell = '', aspas = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (aspas) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else aspas = false }
      else cell += c
    } else if (c === '"') aspas = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/* "-5,83%" vira -5.83; devolve null quando a célula não tem número */
function pctBR(s) {
  let t = (s || '').replace(/\u2212/g, '-').replace(/[^\d,.-]/g, '')
  if (!/\d/.test(t)) return null
  t = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  const v = parseFloat(t)
  return Number.isFinite(v) ? v : null
}

/* constrói o path SVG da curva de capital a partir de operações */
function buildCurve(ops, W = 860, H = 210, pad = 8) {
  let pts = (ops || []).map(o => ({
    k: ddmmToInt(o.abertura),
    r: o.res_op || 0,
  })).filter(p => p.k).sort((a, b) => a.k - b.k)
  if (pts.length < 2) return null
  // downsample p/ no máximo ~240 pontos
  if (pts.length > 240) {
    const step = Math.ceil(pts.length / 240)
    pts = pts.filter((_, i) => i % step === 0 || i === pts.length - 1)
  }
  let cum = 0
  const cums = pts.map(p => (cum += p.r, cum))
  const min = Math.min(0, ...cums), max = Math.max(...cums), range = (max - min) || 1
  const n = cums.length
  const line = cums.map((v, i) => {
    const x = pad + (i / (n - 1)) * (W - 2 * pad)
    const y = (H - pad) - ((v - min) / range) * (H - 2 * pad)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const first = line.match(/M[\d.]+,[\d.]+/)[0].slice(1)
  const lastX = (pad + (W - 2 * pad)).toFixed(1)
  const area = `${line} L${lastX},${H} L${first.split(',')[0]},${H} Z`
  return { line, area }
}

export default function HomePage() {
  const navigate = useNavigate()
  const { robots, mentPortfolios, mentOps, loading } = useData()

  // fontes
  useEffect(() => {
    const id = 'ap-fonts'
    if (document.getElementById(id)) return
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap'
    document.head.appendChild(l)
  }, [])

  // reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.ap .reveal, .ap .reveal-x')
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .16 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [loading])

  // métricas reais dos robôs
  const stats = useMemo(() => {
    const pub = (robots || []).filter(r => (r.platform || 'profit') !== 'mt5')
    const pfs = []
    pub.forEach(r => {
      if (r.operations?.length) {
        const m = calcMetrics(buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest'))
        if (m.profitFactor) pfs.push(m.profitFactor)
      }
    })
    const pfMedio = pfs.length ? pfs.reduce((a, b) => a + b, 0) / pfs.length : 0
    // só conta como estratégia o robô que tem operação publicada
    const comOps = pub.filter(r => r.operations?.length).length
    return { nEstrat: comOps, pfMedio }
  }, [robots])

  // conta pessoal: um único cálculo alimenta a curva, o rodapé e o spec do herói
  const pessoal = useMemo(() => {
    const p = (mentPortfolios || []).find(x => norm(x.name) === PORTFOLIO_HOME)
    if (!p) return null
    const ops = applyLotes(mentOps || [], getConfigVersions(p))
    if (!ops.length) return null
    const capital = parseFloat(p.capital_inicial) || 0
    const total = ops.reduce((s, o) => s + o.res_op, 0)
    return {
      ops,
      capital,
      total,
      pctCapital: capital ? (total / capital) * 100 : null,
      media: serieMensal(ops, capital),
      ini: (ops[0].abertura || '').slice(0, 10),
      fim: (ops[ops.length - 1].abertura || '').slice(0, 10),
    }
  }, [mentPortfolios, mentOps])

  const curve = useMemo(() => buildCurve(pessoal?.ops), [pessoal])

  // ranking da Copa: planilha oficial ao vivo, com o último snapshot como reserva
  const [copa, setCopa] = useState(null)
  useEffect(() => {
    let vivo = true
    const ordena = (l) => l.filter(r => r.nome && r.rent != null).sort((a, b) => b.rent - a.rent)
    ;(async () => {
      try {
        const r = await fetch(COPA_CSV)
        if (!r.ok) throw new Error('csv')
        const robos = ordena(parseCSV(await r.text()).slice(1)
          .map(c => ({ nome: (c[0] || '').trim(), rent: pctBR(c[1]) })))
        if (!robos.length) throw new Error('vazio')
        if (vivo) setCopa({ robos, aoVivo: true })
      } catch {
        try {
          const d = await (await fetch(COPA_SNAPSHOT)).json()
          if (vivo) setCopa({ robos: ordena(d.robos || []), aoVivo: false, data: d.atualizado, mes: d.mes })
        } catch { if (vivo) setCopa({ robos: [] }) }
      }
    })()
    return () => { vivo = false }
  }, [])

  // mostra os 4 primeiros e o último colocado: quem lidera e quem apanhou
  const copaLista = useMemo(() => {
    const r = copa?.robos || []
    if (!r.length) return null
    const linhas = r.length > 5
      ? [...r.slice(0, 4).map((x, i) => ({ ...x, pos: i + 1 })),
         { ...r[r.length - 1], pos: r.length, lanterna: true }]
      : r.slice(0, 5).map((x, i) => ({ ...x, pos: i + 1 }))
    return { linhas, max: Math.max(...linhas.map(x => Math.abs(x.rent))) || 1 }
  }, [copa])
  const rentMensal = pessoal?.media ? fmtPct1(pessoal.media.pct) : null

  // avaliações (Supabase, ao vivo)
  const [aval, setAval] = useState(null)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('avaliacoes').select('suporte, aulas, estrategias, didatica, compraria')
        if (error || !data?.length) { setAval({ n: 0 }); return }
        const med = k => { const v = data.map(r => r[k]).filter(x => x != null && x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }
        const eixos = ['suporte', 'aulas', 'estrategias', 'didatica'].map(med).filter(v => v > 0)
        setAval({
          n: data.length,
          geral: eixos.length ? eixos.reduce((a, b) => a + b, 0) / eixos.length : 0,
          pct: Math.round(data.filter(r => r.compraria).length / data.length * 100),
        })
      } catch { setAval({ n: 0 }) }
    })()
  }, [])

  const go = (to) => (e) => { e.preventDefault(); navigate(to) }

  return (
    <div className="ap">
      <style>{CSS}</style>

      <nav className="ap-nav">
        <div className="ap-brand">Frantiesco <span>Trader</span></div>
        <div className="ap-navr">
          <a href="#mentoria">Mentoria</a><a href="#copa">Copa</a><a href="#resultados">Resultados</a><a href="#historia">História</a>
          <a className="ap-navcta" href="/resultados" onClick={go('/resultados')}>Começar</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="ap-hero">
        <div className="ap-glow" />
        <div className="ap-wrap ap-hero-in">
          <div className="ap-eyebrow">Método 6015</div>
          <h1 className="ap-h1">Robôs que <span className="g">provam</span><br />o resultado.</h1>
          <p className="ap-lede">Estratégias quantitativas rodando em conta real, com o histórico aberto. Você vê antes de confiar.</p>
          <div className="ap-cta">
            <a className="ap-btn grad" href="/resultados" onClick={go('/resultados')}>Ver resultados reais</a>
            <a className="ap-btn ghost" href="/mentoria_metodo6015" onClick={go('/mentoria_metodo6015')}>Conhecer o método</a>
          </div>
        </div>

        <div className="ap-wrap">
          <div className="ap-specs reveal">
            <div className="ap-spec"><div className="v up mono">{loading || !rentMensal ? '—' : rentMensal}</div><div className="k">Rent. média mensal · portfólio público</div></div>
            <div className="ap-spec"><div className="v mono">{loading || !pessoal?.media ? '—' : `${pessoal.media.n} meses`}</div><div className="k">De conta aberta</div></div>
            <div className="ap-spec"><div className="v mono">{loading ? '—' : stats.nEstrat}</div><div className="k">Estratégias</div></div>
            <div className="ap-spec"><div className="v mono">{loading ? '—' : fmtNum(stats.pfMedio)}</div><div className="k">Fator de lucro médio</div></div>
          </div>
        </div>
      </section>

      {/* MENTORIA */}
      <section className="ap-sec" id="mentoria"><div className="ap-wrap"><div className="ap-row">
        <div className="ap-txt reveal">
          <div className="ap-kick">Mentoria</div>
          <h2 className="ap-h2">Um método pronto. Você só segue o passo a passo.</h2>
          <p className="ap-p">Não precisa de nenhum conhecimento prévio. O Método 6015 funciona como uma receita de bolo: cada etapa já está definida pra você colocar os robôs pra operar do mesmo jeito que um trader profissional e consistente opera.</p>
          <a className="ap-go" href="/mentoria_metodo6015" onClick={go('/mentoria_metodo6015')}><span className="a">Conhecer a mentoria →</span></a>
        </div>
        <div className="ap-card reveal-x">
          <div className="ap-cbar"><span>O passo a passo</span><span>4 etapas</span></div>
          <div className="ap-steps">
            <div className="ap-step"><span className="n">01</span>
              <div className="t">Instalar</div>
              <div className="dsc">Os robôs entram no seu Profit numa tarde, com a lista pronta.</div></div>
            <div className="ap-step"><span className="n">02</span>
              <div className="t">Configurar</div>
              <div className="dsc">Capital, lotes e horários já vêm definidos. Você copia.</div></div>
            <div className="ap-step"><span className="n">03</span>
              <div className="t">Operar</div>
              <div className="dsc">Você liga de manhã e o robô executa sozinho o dia inteiro.</div></div>
            <div className="ap-step"><span className="n">04</span>
              <div className="t">Acompanhar</div>
              <div className="dsc">Resultado publicado mês a mês, com suporte direto para qualquer tipo de dúvida.</div></div>
          </div>
        </div>
      </div></div></section>

      {/* COPA */}
      <section className="ap-sec" id="copa"><div className="ap-wrap"><div className="ap-row rev">
        <div className="ap-txt reveal">
          <div className="ap-kick">Copa dos Robôs</div>
          <h2 className="ap-h2">15 robôs. 30 dias de teste grátis.</h2>
          <p className="ap-p">Uma competição ao vivo pela maior rentabilidade. Você entra no teste grátis por 30 dias e escolhe quais robôs quer rodar. Acompanha o ranking subir em tempo real.</p>
          <a className="ap-go" href="/copa-dos-robos" onClick={go('/copa-dos-robos')}><span className="a">Ver a Copa →</span></a>
        </div>
        <div className="ap-card reveal-x from-left">
          <div className="ap-cbar">
            <span>Ranking · {copa?.mes || 'Agosto'}</span>
            <span>{!copa ? '—' : copa.aoVivo ? 'ao vivo' : `posição de ${copa.data}`}</span>
          </div>
          {copaLista ? (
            <>
              {copaLista.linhas.map(r => (
                <div className={r.lanterna ? 'ap-rk lanterna' : 'ap-rk'} key={r.nome}>
                  <span className="pos">{r.pos}</span>
                  <span className="nm">{r.nome}</span>
                  <span className="bar">
                    <i className={r.rent >= 0 ? 'up' : 'dn'}
                       style={{ width: `${Math.max(4, Math.abs(r.rent) / copaLista.max * 100)}%` }} />
                  </span>
                  <span className={`val ${r.rent >= 0 ? 'up' : 'dn'}`}>{fmtPct1(r.rent)}</span>
                </div>
              ))}
              <div className="ap-rkfoot">
                {copa.robos.length} algoritmos na disputa. O primeiro e o último, os dois publicados.
              </div>
            </>
          ) : (
            <div className="ap-rkfoot">{copa ? 'ranking indisponível agora' : 'carregando o ranking'}</div>
          )}
        </div>
      </div></div></section>

      {/* RESULTADOS */}
      <section className="ap-sec" id="resultados"><div className="ap-wrap">
        <div className="reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div className="ap-kick" style={{ justifyContent: 'center' }}>Transparência</div>
          <h2 className="ap-h2" style={{ textAlign: 'center' }}>Resultados, abertos.</h2>
          <p className="ap-p" style={{ margin: '0 auto' }}>Nada de projeção. Você acompanha os resultados dos portfólios, dos robôs e o fechamento de cada mês.</p>
        </div>

        <div className="ap-card reveal" style={{ margin: '38px auto 0', maxWidth: 900 }}>
          <div className="ap-cbar"><span>Curva de capital · portfólio público</span><span style={{ color: 'var(--up)' }}>● Conta real</span></div>
          <div className="ap-chart">
            <svg viewBox="0 0 860 210" preserveAspectRatio="none">
              <defs>
                <linearGradient id="apg" x1="0" y1="0" x2="860" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#00E0B8" /><stop offset="1" stopColor="#38C6FF" /></linearGradient>
                <linearGradient id="apa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00E0B8" stopOpacity=".2" /><stop offset="1" stopColor="#00E0B8" stopOpacity="0" /></linearGradient>
              </defs>
              <g className="grid"><line x1="0" y1="52" x2="860" y2="52" /><line x1="0" y1="120" x2="860" y2="120" /><line x1="0" y1="188" x2="860" y2="188" /></g>
              {curve ? (<>
                <path className="area" d={curve.area} />
                <path className="curve" d={curve.line} />
              </>) : (
                <text x="430" y="110" textAnchor="middle" className="axis">carregando a curva</text>
              )}
            </svg>
          </div>
          {pessoal && (
            <div className="ap-cfoot">
              <span>{pessoal.ini} a {pessoal.fim}</span>
              {pessoal.pctCapital != null && (
                <span className={pessoal.pctCapital >= 0 ? 'up' : 'dn'}>
                  {fmtPct1(pessoal.pctCapital)} sobre o capital
                </span>
              )}
              <span>{pessoal.media?.n} meses · {pessoal.ops.length} operações</span>
            </div>
          )}
        </div>

        <div className="ap-trio reveal">
          <a className="ap-tcard" href="/resultados" onClick={go('/resultados')}><div className="tt">Portfólios</div><div className="td">Carteiras recomendadas em conta real.</div><span className="ap-go"><span className="a">Ver →</span></span></a>
          <a className="ap-tcard" href="/estrategias" onClick={go('/estrategias')}><div className="tt">Robôs</div><div className="td">Cada estratégia com análise completa.</div><span className="ap-go"><span className="a">Ver →</span></span></a>
          <a className="ap-tcard" href="/resultado-do-mes" onClick={go('/resultado-do-mes')}><div className="tt">Resultados do mês</div><div className="td">O fechamento mais recente, mês a mês.</div><span className="ap-go"><span className="a">Ver →</span></span></a>
        </div>
      </div></section>

      {/* MINHA HISTÓRIA */}
      <section className="ap-sec" id="historia"><div className="ap-wrap"><div className="ap-row reveal">
        <div className="ap-txt">
          <div className="ap-kick">Sobre mim</div>
          <h2 className="ap-h2">Operando com ciência desde 2017.</h2>
          <p className="ap-p">Desenvolvo estratégias quantitativas para o mercado brasileiro, criei o Método 6015 e sou parceiro Nelogica e XP. A trajetória inteira está publicada, com os acertos e também as quedas.</p>
          <a className="ap-go" href="/historico" onClick={go('/historico')}><span className="a">Minha trajetória →</span></a>
        </div>
        <div className="ap-bw"><img src={FOTO} alt="Frantiesco" /></div>
      </div></div></section>

      {/* AVALIAÇÕES */}
      <section className="ap-sec" id="avaliacoes"><div className="ap-wrap"><div className="ap-row rev reveal">
        <div className="ap-txt">
          <div className="ap-kick">Quem já fez</div>
          <h2 className="ap-h2">O que os alunos dizem.</h2>
          <p className="ap-p">Avaliações reais de quem passou pela mentoria: nota, consistência e o que mudou na operação de cada um.</p>
          <a className="ap-go" href="/avaliacoes" onClick={go('/avaliacoes')}><span className="a">Ler avaliações →</span></a>
        </div>
        <div className="ap-card">
          {aval && aval.n > 0 ? (<>
            <div className="ap-stars">{'★★★★★'.slice(0, Math.round(aval.geral))}<span style={{ color: 'rgba(255,255,255,.18)' }}>{'★★★★★'.slice(Math.round(aval.geral))}</span></div>
            <div style={{ display: 'flex', gap: 26, margin: '16px 0 18px' }}>
              <div><div className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{aval.geral.toFixed(1).replace('.', ',')}</div><div className="ap-k">nota geral</div></div>
              <div><div className="mono" style={{ fontSize: 30, fontWeight: 600, color: 'var(--up)' }}>{aval.pct}%</div><div className="ap-k">comprariam de novo</div></div>
              <div><div className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{aval.n}</div><div className="ap-k">avaliações</div></div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: 0, borderTop: '1px solid var(--line)', paddingTop: 16 }}>Depoimentos de quem opera com o Método 6015.</p>
          </>) : (
            <div className="ap-cbar"><span>Avaliações dos alunos</span></div>
          )}
        </div>
      </div></div></section>

      {/* CTA FINAL */}
      <section className="ap-final ap-wrap reveal">
        <h2>Comece pelo resultado.</h2>
        <a className="ap-btn grad" href="/resultados" onClick={go('/resultados')}>Ver resultados reais</a>
      </section>

      <footer className="ap-foot">
        <div>Frantiesco Trader · Método 6015</div>
        <div className="r">Resultados passados não garantem retornos futuros. Operar derivativos envolve risco.</div>
      </footer>
    </div>
  )
}

const CSS = `
.ap{ overflow-x:hidden;
  --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF; --up:#37E29B;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.ap .mono{ font-family:'Geist Mono','SF Mono',monospace; font-variant-numeric:tabular-nums; }
.ap .ap-wrap{ max-width:1120px; margin:0 auto; padding:0 24px; }
.ap a{ color:inherit; text-decoration:none; }
.ap-nav{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
  padding:13px 24px; background:rgba(6,8,9,.65); backdrop-filter:saturate(160%) blur(16px); border-bottom:1px solid var(--line); }
.ap-brand{ font-weight:600; letter-spacing:-.02em; font-size:16px; }
.ap-brand span{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ap-navr{ display:flex; gap:24px; align-items:center; }
.ap-navr a{ color:var(--muted); font-size:14px; }
.ap-navr a:hover{ color:var(--text); }
.ap-navcta{ font-size:13px; font-weight:600; padding:8px 16px; border-radius:999px; background:var(--glass); border:1px solid var(--line); color:var(--text) !important; }
.ap-hero{ position:relative; text-align:center; padding:78px 0 64px; }
.ap-glow{ position:absolute; left:50%; top:60px; width:920px; height:560px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(0,224,184,.28), rgba(56,198,255,.14) 45%, transparent 72%); filter:blur(26px); z-index:0; animation:apbreathe 8s ease-in-out infinite; }
@keyframes apbreathe{ 0%,100%{opacity:.82} 50%{opacity:1; transform:translateX(-50%) scale(1.05)} }
.ap-hero-in{ position:relative; z-index:3; }
.ap-eyebrow{ font-family:'Geist Mono',monospace; font-size:12.5px; letter-spacing:.22em; text-transform:uppercase; color:var(--cyanA); margin-bottom:20px; }
.ap-h1{ font-weight:600; font-size:clamp(42px,7.5vw,88px); line-height:.96; letter-spacing:-.045em; margin:0 0 20px; }
.ap-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ap-lede{ color:var(--muted); font-size:clamp(16px,2vw,20px); line-height:1.55; max-width:38ch; margin:0 auto 28px; }
.ap-cta{ display:flex; gap:13px; justify-content:center; flex-wrap:wrap; }
.ap-btn{ font-weight:600; font-size:16px; padding:14px 28px; border-radius:999px; cursor:pointer; transition:transform .12s; display:inline-block; }
.ap-btn.grad{ background:var(--grad); color:#04140f; box-shadow:0 12px 40px rgba(0,224,184,.26); }
.ap-btn.grad:hover{ transform:translateY(-2px); }
.ap-btn.ghost{ background:var(--glass); border:1px solid var(--line); color:var(--text); }
.ap-specs{ position:relative; z-index:6; display:grid; grid-template-columns:repeat(4,1fr); background:var(--glass);
  border:1px solid var(--line); border-radius:20px; backdrop-filter:blur(20px); max-width:980px; margin:52px auto 0; overflow:hidden; }
.ap-spec{ padding:22px 18px; border-right:1px solid var(--line); text-align:center; }
.ap-spec:last-child{ border-right:none; }
.ap-spec .v{ font-weight:600; font-size:27px; letter-spacing:-.02em; } .ap-spec .v.up{ color:var(--up); }
.ap-spec .k{ font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-top:7px; line-height:1.4; }
.ap-sec{ padding:118px 0; }
.ap-row{ display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
.ap-row.rev .ap-txt{ order:2; }
.ap-kick{ display:flex; font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:16px; }
.ap-h2{ font-weight:600; font-size:clamp(28px,4vw,46px); letter-spacing:-.035em; line-height:1.06; margin:0 0 16px; }
.ap-p{ color:var(--muted); font-size:17px; line-height:1.6; margin:0 0 26px; max-width:44ch; }
.ap-go{ font-weight:600; font-size:16px; display:inline-flex; }
.ap-go .a{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ap-card{ background:var(--glass); border:1px solid var(--line); border-radius:22px; backdrop-filter:blur(16px); padding:24px; box-shadow:0 30px 90px rgba(0,0,0,.4); }
.ap-cbar{ display:flex; justify-content:space-between; font-family:'Geist Mono',monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:16px; }
.ap-lb{ display:flex; align-items:center; gap:12px; padding:11px 0; border-top:1px solid var(--line); font-family:'Geist Mono',monospace; font-size:14px; }
.ap-lb .pos{ color:var(--cyanA); width:20px; } .ap-lb .nm{ flex:1; } .ap-lb .pf{ color:var(--up); }
.ap-mod{ display:flex; align-items:center; gap:12px; padding:12px 0; border-top:1px solid var(--line); font-size:15px; }
.ap-mod .d{ width:7px; height:7px; border-radius:50%; background:var(--tealA); box-shadow:0 0 8px var(--tealA); flex:none; }

/* passo a passo da mentoria: a trilha existe porque a ordem importa */
.ap-steps{ position:relative; padding-left:36px; }
.ap-steps:before{ content:''; position:absolute; left:12px; top:10px; bottom:14px; width:2px; border-radius:2px;
  background:linear-gradient(180deg,var(--tealA) 0%,var(--cyanA) 55%,rgba(91,140,255,.12) 100%); }
.ap-step{ position:relative; padding-bottom:22px; }
.ap-step:last-child{ padding-bottom:0; }
.ap-step .n{ position:absolute; left:-36px; top:1px; width:26px; height:26px; border-radius:50%;
  background:var(--bg); border:1px solid var(--line); color:var(--muted);
  font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:.04em;
  display:grid; place-items:center; }
.ap-step .t{ font-size:15px; font-weight:600; letter-spacing:-.01em; }
.ap-step .dsc{ margin-top:3px; font-size:13.5px; line-height:1.5; color:var(--muted); }

/* ranking da Copa */
.ap-rk{ display:grid; grid-template-columns:18px 1fr 88px 66px; align-items:center; gap:12px;
  padding:10px 0; border-top:1px solid var(--line);
  font-family:'Geist Mono',monospace; font-size:13px; font-variant-numeric:tabular-nums; }
.ap-rk:first-of-type{ border-top:0; }
.ap-rk .pos{ color:var(--muted); font-size:11px; }
.ap-rk .nm{ letter-spacing:.03em; }
.ap-rk .bar{ height:4px; border-radius:3px; background:rgba(255,255,255,.06); overflow:hidden; }
.ap-rk .bar i{ display:block; height:100%; border-radius:3px; }
.ap-rk .bar i.up{ background:linear-gradient(90deg,var(--tealA),var(--cyanA)); }
.ap-rk .bar i.dn{ background:#FF6B6B; }
.ap-rk .val{ text-align:right; } .ap-rk .val.up{ color:var(--up); } .ap-rk .val.dn{ color:#FF6B6B; }
.ap-rk.lanterna{ border-top-style:dashed; border-top-color:rgba(255,255,255,.16); }
.ap-rkfoot{ margin-top:14px; padding-top:12px; border-top:1px solid var(--line);
  font-family:'Geist Mono',monospace; font-size:11px; line-height:1.5; color:var(--muted); }
@media(max-width:520px){
  .ap-rk{ grid-template-columns:16px 1fr 60px; gap:10px; }
  .ap-rk .bar{ display:none; }
}
.ap-chart svg{ display:block; width:100%; height:210px; } .ap-chart .grid line{ stroke:var(--line); }
.ap-chart .curve{ fill:none; stroke:url(#apg); stroke-width:2.6; stroke-linecap:round; stroke-linejoin:round; } .ap-chart .area{ fill:url(#apa); }
.ap-chart .axis{ fill:var(--muted); font-family:'Geist Mono',monospace; font-size:12px; }
.ap-cfoot{ display:flex; justify-content:space-between; gap:10px 22px; flex-wrap:wrap; margin-top:16px; padding-top:14px; border-top:1px solid var(--line);
  font-family:'Geist Mono',monospace; font-size:11.5px; letter-spacing:.02em; color:var(--muted); font-variant-numeric:tabular-nums; }
.ap-cfoot .up{ color:var(--up); } .ap-cfoot .dn{ color:#FF6B6B; }
@media(max-width:640px){ .ap-cfoot{ font-size:11px; gap:6px 14px; } }
.ap-bw img{ width:100%; height:auto; display:block; filter:grayscale(1) contrast(1.05) brightness(.95); border-radius:20px;
  -webkit-mask-image:linear-gradient(180deg,#000 78%,transparent); mask-image:linear-gradient(180deg,#000 78%,transparent); }
.ap-stars{ color:#FFC53D; font-size:22px; letter-spacing:3px; }
.ap-k{ font-family:'Geist Mono',monospace; font-size:11px; color:var(--muted); margin-top:3px; }
.ap-trio{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:34px; }
.ap-tcard{ background:var(--glass); border:1px solid var(--line); border-radius:16px; padding:22px; transition:border-color .15s,transform .15s; display:block; }
.ap-tcard:hover{ border-color:var(--cyanA); transform:translateY(-3px); }
.ap-tcard .tt{ font-weight:600; font-size:17px; margin-bottom:6px; }
.ap-tcard .td{ color:var(--muted); font-size:13px; line-height:1.5; margin-bottom:16px; }
.ap-final{ text-align:center; padding:118px 24px; }
.ap-final h2{ font-weight:600; font-size:clamp(32px,5vw,58px); letter-spacing:-.04em; margin:0 0 28px; }
.ap-foot{ text-align:center; padding:44px 24px 60px; color:var(--muted); font-size:12.5px; border-top:1px solid var(--line); }
.ap-foot .r{ margin-top:8px; font-size:11px; }
.ap .reveal{ opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease; }
.ap .reveal.in{ opacity:1; transform:none; }
/* o card entra pelo lado oposto ao texto, acompanhando a leitura */
.ap .reveal-x{ opacity:0; transform:translateX(52px);
  transition:opacity .85s cubic-bezier(.22,.61,.36,1), transform .85s cubic-bezier(.22,.61,.36,1); }
.ap .reveal-x.from-left{ transform:translateX(-52px); }
.ap .reveal-x.in{ opacity:1; transform:none; }
.ap a:focus-visible, .ap .ap-btn:focus-visible{ outline:2px solid var(--cyanA); outline-offset:3px; }
@media (max-width:820px){
  .ap-navr a:not(.ap-navcta){ display:none; }
  .ap-row{ grid-template-columns:1fr; gap:28px; } .ap-row.rev .ap-txt{ order:0; }
  .ap-specs{ grid-template-columns:1fr 1fr; } .ap-spec:nth-child(1),.ap-spec:nth-child(2){ border-bottom:1px solid var(--line); } .ap-spec:nth-child(2){ border-right:none; }
  .ap-trio{ grid-template-columns:1fr; }
}
@media (prefers-reduced-motion:reduce){
  .ap *{ animation:none !important; }
  .ap .reveal, .ap .reveal-x{ opacity:1; transform:none; transition:none; }
}
`
