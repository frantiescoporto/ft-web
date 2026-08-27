/**
 * MentoriaMetodo6015Page.jsx — v2
 * Fontes: Syne (headlines) + Manrope (body)
 * Animações: fade-in com slide ao scrollar
 * Foto: /public/frantiesco-mentoria.jpg (com fallback)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useData } from '../context/DataContext.jsx'
import './mentoria.css'

// ── Links de checkout (Greenn) ───────────────────────────────────────
const LINK_ANUAL     = 'https://payfast.greenn.com.br/116632/offer/TQ28Gg'
const LINK_SEMESTRAL = 'https://payfast.greenn.com.br/116632/offer/H8T6cc'

// ── PORTFÓLIO PÚBLICO (conta real) — leitura ao vivo ────────────────────────
const CAPITAL_REAL = 12000   // capital real inicial na conta XP (base do cálculo)
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const normName = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function opSortKey(d) {
  if (!d) return ''
  if (d.includes('/')) { const p = d.split('/'), y = (p[2] || '').split(' ')[0].padStart(4, '0'); return `${y}${(p[1] || '').padStart(2, '0')}${(p[0] || '').padStart(2, '0')}` }
  return (d.split('T')[0] || '').replace(/-/g, '')
}
function parseRobots(json) {
  try { const p = JSON.parse(json || '[]'); if (!p.length) return []
    if (typeof p[0] === 'string') return p.map(name => ({ name, lotes: 1 }))
    return p.map(r => ({ name: r.name || String(r), lotes: Number(r.lotes) || 1 }))
  } catch { return [] }
}
function getConfigVersions(portfolio) {
  try { const cv = JSON.parse(portfolio.config_versions || '[]'); if (cv.length > 0) return cv } catch {}
  return [{ valid_from: null, robots_json: portfolio.robots_json || '[]' }]
}
function getAllStrategyNames(portfolio) {
  const names = new Set()
  getConfigVersions(portfolio).forEach(v => parseRobots(v.robots_json).forEach(r => names.add(r.name)))
  return [...names]
}
function applyLotesVersioned(ops, cv) {
  if (!ops.length || !cv || !cv.length) return ops
  if (cv.length === 1 && !cv[0].valid_from) {
    const rc = parseRobots(cv[0].robots_json); const map = {}; rc.forEach(r => { map[r.name] = r.lotes || 1 })
    return ops.filter(op => map[op.ativo] !== undefined).map(op => { const l = map[op.ativo]; return (!l || l === 1) ? op : { ...op, res_op: (op.res_op || 0) * l } })
  }
  return ops.filter(op => {
    const k = opSortKey(op.abertura)
    const valid = cv.filter(v => !v.valid_from || v.valid_from <= k).sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''))
    if (!valid.length) return false
    const rc = parseRobots(valid[0].robots_json); const map = {}; rc.forEach(r => { map[r.name] = r.lotes || 1 })
    return map[op.ativo] !== undefined
  }).map(op => {
    const k = opSortKey(op.abertura)
    const valid = cv.filter(v => !v.valid_from || v.valid_from <= k).sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''))
    const lotes = parseRobots(valid[0].robots_json).find(r => r.name === op.ativo)?.lotes || 1
    return lotes === 1 ? op : { ...op, res_op: (op.res_op || 0) * lotes }
  })
}

// Resultados pelo método do SALDO ACUMULADO sobre o capital real inicial
function computePublico(portfolio, allMentOps, base) {
  if (!portfolio) return null
  const opsByName = {}
  ;(allMentOps || []).forEach(op => { const k = op.ativo; (opsByName[k] || (opsByName[k] = [])).push(op) })
  let ops = getAllStrategyNames(portfolio).flatMap(n => opsByName[n] || [])
  ops = applyLotesVersioned(ops, getConfigVersions(portfolio))
  if (ops.length < 2) return null
  ops = ops.slice().sort((a, b) => opSortKey(a.abertura).localeCompare(opSortKey(b.abertura)))
  let bal = base, peak = base, ddMax = 0
  ops.forEach(o => { bal += (o.res_op || 0); if (bal > peak) peak = bal; const dd = (peak - bal) / peak * 100; if (dd > ddMax) ddMax = dd })
  const total = ops.reduce((s, o) => s + (o.res_op || 0), 0)
  const acumulado = (total / base) * 100
  const byMonth = {}
  ops.forEach(o => { const k = opSortKey(o.abertura).slice(0, 6); byMonth[k] = (byMonth[k] || 0) + (o.res_op || 0) })
  const keys = Object.keys(byMonth).sort()
  let b2 = base; const monthly = []
  keys.forEach(k => { const sum = byMonth[k]; const v = (sum / b2) * 100; b2 += sum; monthly.push({ m: `${MESES_PT[parseInt(k.slice(4, 6), 10) - 1]}/${k.slice(2, 4)}`, v }) })
  const mediaMensal = monthly.length ? monthly.reduce((a, x) => a + x.v, 0) / monthly.length : 0
  return { monthly, acumulado, mediaMensal, ddMax, nMeses: monthly.length, from: monthly[0]?.m, to: monthly[monthly.length - 1]?.m }
}


// ── Dados ─────────────────────────────────────────────────────────────────────



const PILLARS = [
  { n: '01', title: 'Portfólio compartilhado',
    desc: 'Você opera exatamente o que eu opero. Sem adaptações, sem versão resumida. Meu portfólio, na sua conta.' },
  { n: '02', title: '~40 robôs testados',
    desc: '60 a 80 meses de histórico + mínimo 3 meses em conta real antes de entrar no portfólio. WIN, BIT, DOL e WSP.' },
  { n: '03', title: 'Acompanhamento direto comigo',
    desc: 'Acesso ao meu contato. Lives quando o mercado exige. Você fala comigo — não com suporte terceirizado.' },
  { n: '04', title: 'Treinamento completo',
    desc: '30+ horas gravadas: como o mercado funciona, como usar robôs, como montar um plano, como lidar com o emocional.' },
  { n: '05', title: 'Comunidade fechada',
    desc: 'Grupo exclusivo de mentorados. Troca de experiências reais, sem promessa milagrosa e sem sala de sinais.' },
]

const FAQS = [
  { q: 'Preciso saber programar ou análise técnica?',
    a: 'Não. Os robôs já estão prontos e configurados. O treinamento ensina como usá-los — não como criá-los. Se você sabe ligar o computador, já tem o suficiente.' },
  { q: 'Quanto tempo por dia preciso dedicar?',
    a: 'Na prática, 3 a 5 minutos já são suficientes. Quem quer se aprofundar pode dedicar mais. Quem quer algo mais automático também consegue operar assim.' },
  { q: 'Qual o capital mínimo para operar?',
    a: 'R$1.000 já permite operar o portfólio menor. O recomendado para uma operação confortável é a partir de R$3.000.' },
  { q: 'As inscrições estão abertas?',
    a: 'Sim, as inscrições estão abertas agora — com vagas limitadas. O acesso é liberado assim que o pagamento é confirmado. Quando a turma fechar, a página deixa de exibir a oferta.' },
  { q: 'Tem garantia?',
    a: 'Sim — 7 dias de garantia integral. Se nos primeiros 7 dias você sentir que não é para você, devolvemos 100% do valor. Isso não é garantia de retorno financeiro: mercado sempre envolve risco.' },
  { q: 'Qual a diferença para outros cursos de trading?',
    a: 'Você opera o mesmo portfólio que eu opero, com resultados em conta real mês a mês — incluindo os meses negativos. Não é teoria com resultados maquiados. É prática real com acompanhamento direto.' },
  { q: 'Depois da mentoria fico sozinho?',
    a: 'Enquanto você está na mentoria (semestral ou anual), tem acesso completo. Ao final, você sai com o conhecimento, os robôs configurados e a lógica para continuar.' },
]

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, vis]
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '', style = {} }) {
  const [ref, vis] = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`m6-fade ${vis ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  )
}

function AnimCount({ to, suffix = '', dur = 1500 }) {
  const [val, setVal] = useState(0)
  const [ref, vis] = useInView(0.3)
  useEffect(() => {
    if (!vis) return
    const t0 = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * e))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [vis, to, dur])
  return <span ref={ref}>{val.toLocaleString('pt-BR')}{suffix}</span>
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-icon">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MentoriaMetodo6015Page() {
  const [photoSrc, setPhotoSrc]     = useState('/frantiesco-mentoria.jpg')
  const [photoError, setPhotoError] = useState(false)

  const { mentPortfolios, mentOps } = useData()
  const pub = useMemo(() => {
    const p = (mentPortfolios || []).find(x => normName(x.name) === 'portfolio publico') || (mentPortfolios || []).find(x => x.id === 38)
    return computePublico(p, mentOps, CAPITAL_REAL)
  }, [mentPortfolios, mentOps])

  function handlePhotoError() {
    if (photoSrc === '/frantiesco-mentoria.jpg') {
      setPhotoSrc('/frantiesco-mentoria.jpeg')
    } else {
      setPhotoError(true)
    }
  }

  useEffect(() => {
    const id = 'm6-fonts'
    if (document.getElementById(id)) return
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800;900&display=swap'
    document.head.appendChild(l)
  }, [])


  return (
    <div className="m6">

      {/* STICKY */}
      <div className="m6-sticky">
        <span className="m6-sticky-txt">Método 6015 · Inscrições abertas · vagas limitadas</span>
        <a href="#preco" className="m6-btn-xs">Garantir minha vaga</a>
      </div>

      {/* HERO */}
      <section className="m6-hero">
        <div className="m6-ghost">6015</div>
        <div className="m6-hero-inner">
          <div className="m6-hero-text m6-fade visible" style={{ transitionDelay: '100ms' }}>
            <p className="m6-overtitle">INSCRIÇÕES ABERTAS · VAGAS LIMITADAS</p>
            <h1 className="m6-h1">
              Saí de um emprego com salário alto.<br />
              Hoje vivo <em>exclusivamente do mercado.</em><br />
              Esse é o método que me permitiu fazer isso.
            </h1>
            <p className="m6-hero-sub">
              O Método 6015 não é um curso comum — é um acompanhamento completo com os mesmos
              robôs e portfólio que eu opero, em conta real, mês a mês.
            </p>
            <div className="m6-hero-stats">
              <div><b>{pub ? `+${Math.round(pub.acumulado)}%` : '—'}</b><span>acumulado em conta real</span></div>
              <div><b>~40</b><span>robôs disponíveis</span></div>
              <div><b>3–5 min</b><span>por dia já é suficiente</span></div>
            </div>
            <a href="#preco" className="m6-btn-primary">Quero minha vaga na mentoria →</a>
            <p className="m6-hero-note">Turma com vagas limitadas · 7 dias de garantia integral.</p>
          </div>
          <div className="m6-hero-photo m6-fade visible" style={{ transitionDelay: '300ms' }}>
            {!photoError ? (
              <img
                src={photoSrc}
                alt="Frantiesco Trader"
                onError={handlePhotoError}
              />
            ) : (
              <div className="m6-photo-err">
                <span>📸</span>
                <p>Coloque sua foto em:</p>
                <code>public/frantiesco-mentoria.jpg</code>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROOF BAR */}
      <div className="m6-proof-bar">
        {['✔ Conta real, mês a mês','✔ Nem todo mês é positivo — e isso é intencional','✔ Foco no longo prazo','✔ Sem sala de sinais. Sem promessa milagrosa.'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* RESULTADOS */}
      <section className="m6-section">
        <div className="m6-wrap">
          <FadeIn><p className="m6-label">RESULTADOS REAIS · CONTA REAL{pub ? ` · ${pub.from.toUpperCase()} → ${pub.to.toUpperCase()}` : ''}</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">{pub ? `${pub.nMeses} meses` : 'Meses reais'}. Sem edição. Sem cortes.</h2></FadeIn>
          <FadeIn delay={160}><p className="m6-sub">Incluindo os meses negativos — porque é assim que o mercado funciona, e é assim que o Método 6015 se apresenta.</p></FadeIn>

          {pub && (
            <FadeIn delay={100}>
              <div className="m6-hero-stats">
                <div><b>+{Math.round(pub.acumulado)}%</b><span>acumulado</span></div>
                <div><b>+{pub.mediaMensal.toFixed(1).replace('.', ',')}%</b><span>média mensal</span></div>
                <div><b>−{pub.ddMax.toFixed(1).replace('.', ',')}%</b><span>drawdown máximo</span></div>
              </div>
            </FadeIn>
          )}

          <div className="m6-months">
            {(pub ? pub.monthly : []).map(({ m, v }, i) => (
              <FadeIn key={m} delay={i * 40}>
                <div className={`m6-month ${v >= 0 ? 'pos' : 'neg'}`}>
                  <span className="m6-month-lbl">{m}</span>
                  <span className="m6-month-val">{v >= 0 ? '+' : ''}{v.toFixed(2).replace('.', ',')}%</span>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={100}>
            <p className="m6-label" style={{ marginTop: 32 }}>COMO CALCULAMOS</p>
            <p className="m6-sub">
              Partimos do capital real com que a conta começou (R$ 12.000, verificável na XP). A rentabilidade de
              cada mês é o resultado sobre o saldo no início daquele mês (capital + resultado acumulado), e não
              sobre um valor fixo — é o retorno sobre o dinheiro que estava de fato na conta. O drawdown máximo é a
              maior queda do pico ao fundo do saldo. Resultados reais, sem projeção.
            </p>
            <p className="m6-disc">⚠ Resultados passados não garantem resultados futuros. Mercado financeiro envolve risco, incluindo perda de capital.</p>
          </FadeIn>
        </div>
      </section>

      {/* O QUE VOCÊ RECEBE */}
      <section className="m6-section alt">
        <div className="m6-wrap">
          <FadeIn><p className="m6-label">O QUE ESTÁ INCLUÍDO</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">Cinco pilares. Um método.</h2></FadeIn>
          <div className="m6-pillars">
            {PILLARS.map((p, i) => (
              <FadeIn key={p.n} delay={i * 80}>
                <div className="m6-pillar">
                  <span className="m6-pillar-n">{p.n}</span>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="m6-section">
        <div className="m6-wrap m6-forwho">
          <div>
            <FadeIn><p className="m6-label">PARA QUEM É</p></FadeIn>
            <FadeIn delay={80}><h2 className="m6-h2">Criterioso por design.</h2></FadeIn>
            <FadeIn delay={140}><p className="m6-sub">Prefiro perder uma venda do que colocar alguém despreparado dentro da mentoria.</p></FadeIn>
            <FadeIn delay={200}>
              <ul className="m6-list yes">
                <li>✔ Busca consistência no longo prazo</li>
                <li>✔ Aceita que existem meses ruins</li>
                <li>✔ Quer um plano claro para operar</li>
                <li>✔ Consegue dedicar 3 a 5 minutos por dia</li>
                <li>✔ Tem pelo menos R$1.000 para começar</li>
              </ul>
              <ul className="m6-list no">
                <li>✘ Não é para quem busca dinheiro rápido</li>
                <li>✘ Não é para quem não segue regras</li>
                <li>✘ Não é para quem quer resultado em semanas</li>
              </ul>
            </FadeIn>
          </div>
          <div className="m6-nums">
            {[
              { n: 40,  s: '',   lbl: 'robôs disponíveis'     },
              { n: pub ? Math.round(pub.acumulado) : 0, s: '%',  lbl: 'acumulado conta real' },
              { n: 30,  s: 'h+', lbl: 'horas de treinamento'  },
              { n: 1,   s: 'k',  lbl: 'mínimo pra começar'    },
            ].map(({ n, s, lbl }, i) => (
              <FadeIn key={lbl} delay={i * 80}>
                <div className="m6-num-card">
                  <strong><AnimCount to={n} suffix={s} /></strong>
                  <span>{lbl}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="m6-section alt" id="preco">
        <div className="m6-wrap">
          <FadeIn><p className="m6-label">INVESTIMENTO</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">Sem letras miúdas.</h2></FadeIn>
          <div className="m6-plans">
            <FadeIn delay={100}>
              <div className="m6-plan">
                <div className="m6-badges"><span className="m6-badge open">Vagas limitadas</span></div>
                <h4>Semestral</h4>
                <div className="m6-price"><strong>R$ 1.997</strong><span>ou 12× de R$ 205,32</span></div>
                <ul>
                  <li>✔ 6 meses completos</li>
                  <li>✔ Todos os 5 pilares</li>
                  <li>✔ Acesso imediato ao portfólio</li>
                </ul>
                <a href={LINK_SEMESTRAL} target="_blank" rel="noopener noreferrer" className="m6-btn-outline w100">Assinar semestral →</a>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="m6-plan featured">
                <div className="m6-badges">
                  <span className="m6-badge best">Melhor custo-benefício</span>
                  <span className="m6-badge open">Vagas limitadas</span>
                </div>
                <h4>Anual</h4>
                <div className="m6-price"><strong>R$ 2.997</strong><span>ou 12× de R$ 308,00</span></div>
                <ul>
                  <li>✔ 12 meses completos</li>
                  <li>✔ Todos os 5 pilares</li>
                  <li>✔ Ciclo completo de mercado acompanhado</li>
                </ul>
                <a href={LINK_ANUAL} target="_blank" rel="noopener noreferrer" className="m6-btn-primary w100">Assinar anual →</a>
              </div>
            </FadeIn>
          </div>
          <p className="m6-plan-note">Capital mínimo para operar: R$1.000 · Recomendado: R$3.000+</p>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="m6-section">
        <div className="m6-wrap">
          <FadeIn>
            <div className="m6-guarantee">
              <div className="m6-guarantee-num">7</div>
              <div>
                <h3>Dias de garantia</h3>
                <p>Se nos primeiros 7 dias você sentir que a mentoria não é para você, devolvemos o valor integral. Sem perguntas. Sem burocracia.</p>
                <p className="m6-guarantee-note">Esta garantia cobre o acesso à mentoria. Não é garantia de retorno financeiro — mercado financeiro envolve risco e resultados passados não garantem resultados futuros.</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="m6-section alt">
        <div className="m6-wrap m6-faq-wrap">
          <FadeIn><p className="m6-label">PERGUNTAS FREQUENTES</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">Respostas diretas.</h2></FadeIn>
          <div className="m6-faqs">
            {FAQS.map((f, i) => (
              <FadeIn key={f.q} delay={i * 60}>
                <Faq q={f.q} a={f.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="m6-section" id="entrar">
        <div className="m6-wrap m6-form-wrap">
          <FadeIn><p className="m6-label">INSCRIÇÕES ABERTAS</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">Garanta sua vaga.</h2></FadeIn>
          <FadeIn delay={140}><p className="m6-sub">Turma com vagas limitadas. O acesso ao portfólio e aos cinco pilares é liberado assim que o pagamento é confirmado — com 7 dias de garantia integral.</p></FadeIn>
          <FadeIn delay={200}>
            <div className="m6-cta-final">
              <a href={LINK_ANUAL} target="_blank" rel="noopener noreferrer" className="m6-btn-primary w100">
                Plano Anual — R$ 2.997 →
              </a>
              <a href={LINK_SEMESTRAL} target="_blank" rel="noopener noreferrer" className="m6-btn-outline w100">
                Plano Semestral — R$ 1.997 →
              </a>
              <p className="m6-form-note">Pagamento seguro via Greenn · parcelamento em até 12×.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="m6-footer">
        <p>© 2026 Frantiesco Trader · Método 6015</p>
        <p className="m6-footer-disc">
          Resultados passados não garantem resultados futuros. Investimentos no mercado financeiro
          envolvem riscos, incluindo a possibilidade de perda do capital investido. Avalie seu perfil antes de investir.
        </p>
      </footer>

    </div>
  )
}
