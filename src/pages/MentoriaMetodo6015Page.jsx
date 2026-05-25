/**
 * MentoriaMetodo6015Page.jsx — v2
 * Fontes: Syne (headlines) + Manrope (body)
 * Animações: fade-in com slide ao scrollar
 * Foto: /public/frantiesco-mentoria.jpg (com fallback)
 */

import React, { useState, useEffect, useRef } from 'react'
import './mentoria.css'

// ── Dados ─────────────────────────────────────────────────────────────────────

const MONTHLY = [
  { m: 'Fev/25', v:  52.12 }, { m: 'Mar/25', v:  11.24 },
  { m: 'Abr/25', v:  38.99 }, { m: 'Mai/25', v:  48.22 },
  { m: 'Jun/25', v:  -7.90 }, { m: 'Jul/25', v:  29.46 },
  { m: 'Ago/25', v:  35.15 }, { m: 'Set/25', v:  41.93 },
  { m: 'Out/25', v:   1.60 }, { m: 'Nov/25', v:  13.35 },
  { m: 'Dez/25', v:  29.76 }, { m: 'Jan/26', v:  16.69 },
  { m: 'Fev/26', v: -47.28 }, { m: 'Mar/26', v:  16.26 },
  { m: 'Abr/26', v:   0.57 }, { m: 'Mai/26', v:  12.62 },
]

const PORTFOLIOS = [
  { name: 'MENTORIA — 1K',  total: '+179,4%', sem: '+62,2%'  },
  { name: 'MENTORIA — 5K',  total: '+424,8%', sem: '+94,1%'  },
  { name: 'MENTORIA — 10K', total: '+519,9%', sem: '+16,9%'  },
  { name: 'MENTORIA — 15K', total: '+589,6%', sem: '+8,4%'   },
  { name: 'MENTORIA — 20K', total: '+500,9%', sem: '+8,9%'   },
  { name: 'MENTORIA — 25K', total: '+549,0%', sem: '+18,0%'  },
  { name: 'MENTORIA — 35K', total: '+412,9%', sem: '+115,6%' },
]

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
  { q: 'Quando abre a próxima turma?',
    a: 'As turmas abrem de vez em quando, com vagas limitadas. Não há data definida. A lista de espera é a única forma de garantir prioridade.' },
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
  const [form, setForm]         = useState({ name: '', email: '', whatsapp: '' })
  const [status, setStatus]     = useState('idle')
  const [photoSrc, setPhotoSrc]     = useState('/frantiesco-mentoria.jpg')
  const [photoError, setPhotoError] = useState(false)

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

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const r = await fetch('https://formspree.io/f/xpqnjylg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, _subject: 'Lista de espera — Método 6015' }),
      })
      setStatus(r.ok ? 'ok' : 'err')
    } catch { setStatus('err') }
  }

  return (
    <div className="m6">

      {/* STICKY */}
      <div className="m6-sticky">
        <span className="m6-sticky-txt">Método 6015 · Vagas fechadas no momento</span>
        <a href="#lista" className="m6-btn-xs">Quero uma vaga</a>
      </div>

      {/* HERO */}
      <section className="m6-hero">
        <div className="m6-ghost">6015</div>
        <div className="m6-hero-inner">
          <div className="m6-hero-text m6-fade visible" style={{ transitionDelay: '100ms' }}>
            <p className="m6-overtitle">MENTORIA FECHADA · LISTA DE ESPERA ABERTA</p>
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
              <div><b>+491%</b><span>consolidado em conta real</span></div>
              <div><b>~40</b><span>robôs disponíveis</span></div>
              <div><b>3–5 min</b><span>por dia já é suficiente</span></div>
            </div>
            <a href="#lista" className="m6-btn-primary">Entrar na lista de espera →</a>
            <p className="m6-hero-note">Próxima turma sem data definida. Lista tem prioridade.</p>
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
          <FadeIn><p className="m6-label">RESULTADOS REAIS · CONTA REAL · FEV/25 → MAI/26</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">16 meses. Sem edição. Sem cortes.</h2></FadeIn>
          <FadeIn delay={160}><p className="m6-sub">Incluindo os meses negativos — porque é assim que o mercado funciona, e é assim que o Método 6015 se apresenta.</p></FadeIn>
          <div className="m6-months">
            {MONTHLY.map(({ m, v }, i) => (
              <FadeIn key={m} delay={i * 40}>
                <div className={`m6-month ${v >= 0 ? 'pos' : 'neg'}`}>
                  <span className="m6-month-lbl">{m}</span>
                  <span className="m6-month-val">{v >= 0 ? '+' : ''}{v.toFixed(2).replace('.', ',')}%</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={100}>
            <h3 className="m6-h3">Portfólios por capital inicial</h3>
            <div className="m6-tbl-wrap">
              <table className="m6-tbl">
                <thead><tr><th>Portfólio</th><th>Semestre</th><th>Total acumulado</th></tr></thead>
                <tbody>
                  {PORTFOLIOS.map(p => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td className="pos">{p.sem}</td>
                      <td className="pos bold">{p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              { n: 491, s: '%',  lbl: 'consolidado conta real' },
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
                <div className="m6-badges"><span className="m6-badge closed">Fechado</span></div>
                <h4>Semestral</h4>
                <div className="m6-price"><strong>R$ 1.997</strong><span>ou 12× de R$ 205,32</span></div>
                <ul>
                  <li>✔ 6 meses completos</li>
                  <li>✔ Todos os 5 pilares</li>
                  <li>✔ Acesso imediato ao portfólio</li>
                </ul>
                <a href="#lista" className="m6-btn-outline w100">Entrar na lista</a>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="m6-plan featured">
                <div className="m6-badges">
                  <span className="m6-badge best">Melhor custo-benefício</span>
                  <span className="m6-badge closed">Fechado</span>
                </div>
                <h4>Anual</h4>
                <div className="m6-price"><strong>R$ 2.997</strong><span>ou 12× de R$ 308,00</span></div>
                <ul>
                  <li>✔ 12 meses completos</li>
                  <li>✔ Todos os 5 pilares</li>
                  <li>✔ Ciclo completo de mercado acompanhado</li>
                </ul>
                <a href="#lista" className="m6-btn-primary w100">Entrar na lista</a>
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

      {/* FORMULÁRIO */}
      <section className="m6-section" id="lista">
        <div className="m6-wrap m6-form-wrap">
          <FadeIn><p className="m6-label">LISTA DE ESPERA</p></FadeIn>
          <FadeIn delay={80}><h2 className="m6-h2">Avise-me quando abrir.</h2></FadeIn>
          <FadeIn delay={140}><p className="m6-sub">Quando a próxima turma abrir, os inscritos têm prioridade — e às vezes acesso a condições especiais antes do anúncio público.</p></FadeIn>
          <FadeIn delay={200}>
            {status === 'ok' ? (
              <div className="m6-success">
                <span className="m6-success-icon">✔</span>
                <div>
                  <strong>Inscrição confirmada!</strong>
                  <p>Você está na lista. Quando a próxima turma abrir, você será o primeiro a saber.</p>
                </div>
              </div>
            ) : (
              <form className="m6-form" onSubmit={submit}>
                <input className="m6-input" type="text" placeholder="Seu nome" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="m6-input" type="email" placeholder="Seu melhor e-mail" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <input className="m6-input" type="tel" placeholder="WhatsApp (com DDD)" required
                  value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                <button type="submit" className="m6-btn-primary" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Enviando...' : 'Quero uma vaga quando abrir →'}
                </button>
                {status === 'err' && <p className="m6-err">Erro ao enviar. Tente novamente.</p>}
                <p className="m6-form-note">Sem spam. Só aviso quando abrir vagas.</p>
              </form>
            )}
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
