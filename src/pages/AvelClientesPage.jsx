import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { CDI_MONTHLY } from '../lib/benchmarks.js'

/**
 * AvelClientesPage.jsx — rota /avel-clientes
 *
 * Página dedicada ao cliente Avel. Mostra o histórico REAL do portfólio
 * NELO + AVEL (conta real), o calendário de resultados e a curva de patrimônio
 * comparada ao CDI.
 *
 * ── DE ONDE VEM CADA NÚMERO ──────────────────────────────────────────────────
 *  - Operações: public/data/mentorados-ops.json, filtradas pelos robôs do
 *    portfólio (mentorados-portfolios.json) e multiplicadas pelos lotes.
 *  - Capital base: campo capital_inicial do próprio portfólio.
 *  - CDI: src/lib/benchmarks.js — série 4390 do Banco Central (oficial).
 *  Nada é digitado à mão nesta página.
 *
 * ── COMO A CURVA É MONTADA ───────────────────────────────────────────────────
 *  O portfólio opera com LOTE FIXO, então o resultado não é reinvestido: a
 *  curva é (capital + lucro acumulado) / capital × 100.
 *  O CDI é juros compostos sobre o mesmo capital inicial.
 *  Essa diferença está escrita na tela — não pode ser omitida.
 */

const PORTFOLIO_NOME = 'NELO + AVEL'
const WHATSAPP = 'https://wa.me/5553999010262?text=' + encodeURIComponent(
  'Olá Frantiesco! Sou cliente Avel e quero falar sobre o portfólio NELO + AVEL.'
)

const s = {
  accent: '#00d4aa',
  dark: '#080c12',
  surface: '#0f1520',
  card: '#131b28',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5',
  muted: '#6b7a99',
  warning: '#f5a623',
  blue: '#4f8ef7',
  pos: '#34d47e',
  neg: '#f06060',
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_LONGO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const fmtR = (n) => (n < 0 ? '-' : '') + 'R$ ' +
  Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtRc = (n) => (n < 0 ? '-' : '') + 'R$ ' +
  Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const fmtP = (n) => (n > 0 ? '+' : n < 0 ? '-' : '') +
  Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

// ── Página ───────────────────────────────────────────────────────────────────

export default function AvelClientesPage() {
  const navigate = useNavigate()
  const { mentPortfolios, mentOps, loading } = useData()

  const dados = useMemo(() => {
    if (!mentPortfolios?.length) return null
    const p = mentPortfolios.find(x => (x.name || '').trim().toUpperCase() === PORTFOLIO_NOME)
    if (!p) return { erro: `Portfólio "${PORTFOLIO_NOME}" não encontrado nos dados.` }

    const robos = typeof p.robots_json === 'string' ? JSON.parse(p.robots_json) : (p.robots_json || [])
    const porNome = {}
    robos.forEach(r => { porNome[r.name] = r.lotes || 1 })

    const ops = (mentOps || [])
      .filter(o => porNome[o.ativo])
      .map(o => ({
        data: (o.abertura || '').split(' ')[0],
        res: (o.res_op || 0) * porNome[o.ativo],
        ativo: o.ativo,
      }))
      .filter(o => o.data)
    if (!ops.length) return { erro: 'Sem operações reais para este portfólio.' }

    const capital = p.capital_inicial || 0

    // por dia (DD/MM/AAAA) e por mês (AAAA-MM)
    const porDia = {}
    const porMes = {}
    ops.forEach(o => {
      const [d, m, a] = o.data.split('/')
      if (!a) return
      porDia[o.data] = (porDia[o.data] || 0) + o.res
      const k = `${a}-${m}`
      porMes[k] = (porMes[k] || 0) + o.res
    })

    const meses = Object.keys(porMes).sort()
    // curva: capital + lucro acumulado, indexada em 100
    let saldo = capital
    let picoIdx = 100
    let maxDD = 0
    const curva = meses.map(k => {
      saldo += porMes[k]
      const idx = capital ? (saldo / capital) * 100 : 100
      picoIdx = Math.max(picoIdx, idx)
      maxDD = Math.max(maxDD, picoIdx > 0 ? ((picoIdx - idx) / picoIdx) * 100 : 0)
      return { mes: k, resultado: porMes[k], saldo, idx }
    })

    // CDI composto no mesmo período
    let cdiIdx = 100
    let cdiCompleto = true
    const curvaCDI = meses.map(k => {
      const taxa = CDI_MONTHLY[k]
      if (taxa == null) cdiCompleto = false
      else cdiIdx *= (1 + taxa / 100)
      return { mes: k, idx: cdiIdx }
    })

    const totais = meses.reduce((a, k) => a + porMes[k], 0)
    const positivos = meses.filter(k => porMes[k] > 0).length
    const valores = meses.map(k => porMes[k])

    // anos para o calendário mensal
    const anos = [...new Set(meses.map(k => k.slice(0, 4)))].sort()

    // dias disponíveis para o calendário diário
    const diasPorMes = {}
    Object.keys(porDia).forEach(dia => {
      const [d, m, a] = dia.split('/')
      const k = `${a}-${m}`
      if (!diasPorMes[k]) diasPorMes[k] = {}
      diasPorMes[k][parseInt(d, 10)] = porDia[dia]
    })

    return {
      portfolio: p, robos, capital, ops, meses, porMes, porDia, diasPorMes,
      curva, curvaCDI, cdiCompleto, anos,
      resumo: {
        total: totais,
        pctTotal: capital ? (totais / capital) * 100 : 0,
        indiceFinal: curva.length ? curva[curva.length - 1].idx : 100,
        indiceCDI: curvaCDI.length ? curvaCDI[curvaCDI.length - 1].idx : 100,
        nMeses: meses.length,
        positivos,
        nOps: ops.length,
        melhorMes: Math.max.apply(null, valores),
        piorMes: Math.min.apply(null, valores),
        maxDD,
        saldoAtual: saldo,
        inicio: meses[0],
        fim: meses[meses.length - 1],
      },
    }
  }, [mentPortfolios, mentOps])

  const [mesSel, setMesSel] = useState(null)
  const mesAtivo = mesSel || (dados && dados.meses ? dados.meses[dados.meses.length - 1] : null)

  if (loading) {
    return (
      <div style={{ background: s.dark, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: s.muted }}>
        Carregando...
      </div>
    )
  }

  if (!dados || dados.erro) {
    return (
      <div style={{ background: s.dark, minHeight: '100vh', color: s.text, padding: 40 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer',
            fontSize: 13, marginBottom: 20 }}>← voltar</button>
        <div style={{ color: s.neg }}>{(dados && dados.erro) || 'Sem dados.'}</div>
      </div>
    )
  }

  const { resumo, curva, curvaCDI, cdiCompleto, anos, porMes, capital, robos, diasPorMes } = dados

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 32px' }}>
        <button onClick={() => navigate('/')}
          style={{ display: 'block', background: 'none', border: 'none', color: s.muted,
            fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
          ← voltar para a home
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          border: `1px solid ${s.accent}55`, borderRadius: 99, padding: '5px 16px',
          fontSize: 12, color: s.accent, fontWeight: 700, letterSpacing: '.08em',
          marginBottom: 20, background: `${s.accent}0d` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent,
            display: 'inline-block', boxShadow: `0 0 8px ${s.accent}` }} />
          ÁREA DO CLIENTE AVEL · CONTA REAL
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 4.6vw, 54px)', fontWeight: 900,
          lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Portfólio {PORTFOLIO_NOME}
        </h1>

        <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', color: s.muted,
          lineHeight: 1.7, maxWidth: 660, marginBottom: 30 }}>
          {robos.length} estratégias rodando em conta real desde{' '}
          {mesLegivel(resumo.inicio)}. {resumo.nOps.toLocaleString('pt-BR')} operações,{' '}
          {resumo.nMeses} meses de histórico — todos publicados, inclusive os negativos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Kpi rotulo="Resultado acumulado" valor={fmtRc(resumo.total)} cor={resumo.total >= 0 ? s.pos : s.neg} />
          <Kpi rotulo="Sobre o capital base" valor={fmtP(resumo.pctTotal)} cor={s.pos}
            nota={`base de ${fmtRc(capital)}`} />
          <Kpi rotulo="Meses positivos" valor={`${resumo.positivos} de ${resumo.nMeses}`} />
          <Kpi rotulo="Maior queda da curva" valor={`-${resumo.maxDD.toFixed(1)}%`} cor={s.neg}
            nota="pico a fundo, mensal" />
          <Kpi rotulo="Melhor mês" valor={fmtRc(resumo.melhorMes)} cor={s.pos} />
          <Kpi rotulo="Pior mês" valor={fmtRc(resumo.piorMes)} cor={s.neg} />
        </div>
      </section>

      {/* ── CURVA x CDI ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 0' }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 800,
          letterSpacing: '-0.02em', marginBottom: 6 }}>
          Curva de patrimônio x CDI
        </h2>
        <p style={{ color: s.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20, maxWidth: 720 }}>
          Os dois começam em 100, no mesmo mês e com o mesmo capital. A escala é
          logarítmica — é o que permite ver o CDI e o portfólio no mesmo gráfico sem
          esmagar um dos dois.
        </p>
        <GraficoCurva curva={curva} curvaCDI={curvaCDI} />
        <p style={{ color: s.muted, fontSize: 12, lineHeight: 1.7, marginTop: 14, maxWidth: 780 }}>
          O portfólio opera com <strong style={{ color: s.text }}>lote fixo</strong>: o lucro não
          é reinvestido, então a curva é o capital inicial mais o resultado acumulado. O CDI
          está com juros compostos, que é como ele realmente rende. São regimes diferentes, e
          isso favorece o CDI na comparação de longo prazo — mesmo assim o portfólio termina o
          período em {resumo.indiceFinal.toFixed(0)} contra {resumo.indiceCDI.toFixed(0)} do CDI.
          {!cdiCompleto && ' Alguns meses não têm CDI publicado ainda e ficam achatados na linha.'}
        </p>
      </section>

      {/* ── CALENDÁRIO MENSAL ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 0' }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 800,
          letterSpacing: '-0.02em', marginBottom: 6 }}>
          Histórico mês a mês
        </h2>
        <p style={{ color: s.muted, fontSize: 13, marginBottom: 20 }}>
          Percentual sobre o capital base de {fmtRc(capital)}. Clique em um mês para abrir o
          calendário daquele mês, dia por dia.
        </p>

        <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860, fontSize: 12 }}>
            <thead>
              <tr style={{ background: s.surface }}>
                <th style={thStyle(false, 64)}>Ano</th>
                {MESES.map(m => <th key={m} style={thStyle(true)}>{m}</th>)}
                <th style={{ ...thStyle(true), color: s.text }}>Ano</th>
              </tr>
            </thead>
            <tbody>
              {anos.map(ano => {
                const totalAno = MESES.reduce((a, _, i) => {
                  const k = `${ano}-${String(i + 1).padStart(2, '0')}`
                  return a + (porMes[k] || 0)
                }, 0)
                return (
                  <tr key={ano} style={{ borderTop: `1px solid ${s.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>{ano}</td>
                    {MESES.map((_, i) => {
                      const k = `${ano}-${String(i + 1).padStart(2, '0')}`
                      const v = porMes[k]
                      const pct = v == null || !capital ? null : (v / capital) * 100
                      const ativo = mesAtivo === k
                      return (
                        <td key={i}
                          onClick={() => v != null && setMesSel(k)}
                          title={v == null ? '' : `${mesLegivel(k)}: ${fmtR(v)}`}
                          style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap',
                            cursor: v == null ? 'default' : 'pointer',
                            fontWeight: pct == null ? 400 : 700,
                            color: pct == null ? 'rgba(255,255,255,0.15)' : pct > 0 ? s.pos : pct < 0 ? s.neg : s.muted,
                            background: ativo ? `${s.accent}1a` : 'transparent',
                            borderLeft: ativo ? `2px solid ${s.accent}` : '2px solid transparent' }}>
                          {pct == null ? '·' : fmtP(pct)}
                        </td>
                      )
                    })}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800,
                      background: 'rgba(255,255,255,0.03)',
                      color: totalAno > 0 ? s.pos : totalAno < 0 ? s.neg : s.muted }}>
                      {capital ? fmtP((totalAno / capital) * 100) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CALENDÁRIO DIÁRIO ── */}
      {mesAtivo && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 0' }}>
          <h2 style={{ fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 4 }}>
            {mesLegivel(mesAtivo)}
          </h2>
          <p style={{ color: s.muted, fontSize: 13, marginBottom: 18 }}>
            Resultado de cada pregão. Dias em branco não tiveram operação.
          </p>
          <CalendarioDoMes mes={mesAtivo} dias={diasPorMes[mesAtivo] || {}} />
        </section>
      )}

      {/* ── VANTAGENS AVEL ── */}
      <section style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        borderBottom: `1px solid ${s.border}`, marginTop: 56 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 32px' }}>
          <div style={{ fontSize: 12, color: s.accent, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Por que operar pela Avel
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 16 }}>
            A estrutura que faz a automação sair do papel.
          </h2>
          <p style={{ color: s.muted, fontSize: 15, lineHeight: 1.75, maxWidth: 720, marginBottom: 30 }}>
            Rodar robô não é só ter o robô. É ter a plataforma certa liberada, o módulo que
            executa a automação e alguém do outro lado que entende do assunto quando alguma
            coisa trava no meio do pregão.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(212px, 1fr))', gap: 14 }}>
            {[
              {
                icone: '📊',
                titulo: 'Profit Pro liberado',
                texto: 'A versão profissional da plataforma da Nelogica, com gráfico, book e todas as ferramentas de análise — sem custo de assinatura enquanto você mantém o giro.',
              },
              {
                icone: '⚙️',
                titulo: 'Módulo Plus incluso',
                texto: 'É o módulo que roda a automação de verdade: robôs executando sozinhos, sem você precisar estar na frente da tela.',
              },
              {
                icone: '🎯',
                titulo: '200 minicontratos por mês',
                texto: 'Esse é o giro que libera o Profit Pro com o módulo Plus. Um portfólio de automações atinge esse volume sem esforço no operacional normal.',
              },
              {
                icone: '🤝',
                titulo: 'Atendimento especializado',
                texto: 'Equipe que conhece automação e mesa de futuros. Não é call center genérico — é quem sabe o que é um robô travado e resolve.',
              },
            ].map((c, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`,
                borderRadius: 14, padding: '24px' }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{c.icone}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: s.accent }}>
                  {c.titulo}
                </div>
                <div style={{ fontSize: 13.5, color: s.muted, lineHeight: 1.7 }}>{c.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPOSIÇÃO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 32px 0' }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.6vw, 26px)', fontWeight: 800,
          letterSpacing: '-0.02em', marginBottom: 6 }}>
          O que tem dentro do portfólio
        </h2>
        <p style={{ color: s.muted, fontSize: 13, marginBottom: 18 }}>
          {robos.length} estratégias, cada uma com o número de lotes configurado.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {robos.map((r, i) => (
            <span key={i} style={{ fontSize: 13, padding: '7px 14px', background: s.card,
              border: `1px solid ${s.border}`, borderRadius: 99, fontWeight: 600 }}>
              {r.name}
              <span style={{ color: s.muted, fontWeight: 400 }}> · {r.lotes || 1} lote{(r.lotes || 1) > 1 ? 's' : ''}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 32px' }}>
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '36px 40px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 10 }}>
              Dúvida sobre o portfólio ou a conta?
            </h2>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Me chama no WhatsApp que eu te ajudo com a configuração, o dimensionamento
              de lotes para o seu capital e o que mais precisar.
            </p>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: s.accent, color: '#04140f', padding: '14px 28px',
              borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none',
              whiteSpace: 'nowrap', transition: 'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Falar no WhatsApp →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        padding: '28px 32px', textAlign: 'center', color: s.muted, fontSize: 13 }}>
        <div style={{ maxWidth: 800, margin: '0 auto 10px', fontSize: 12, lineHeight: 1.7 }}>
          ⚠ Resultados de conta real do portfólio {PORTFOLIO_NOME}, apurados sobre capital base
          de {fmtRc(capital)} com lote fixo. Resultados passados não garantem resultados futuros.
          Operações no mercado futuro envolvem risco, incluindo a possibilidade de perda do
          capital investido. CDI: série 4390 do Banco Central do Brasil.
        </div>
        <div>Frantiesco Trader · Método 6015</div>
      </footer>
    </div>
  )
}

// ── Gráfico da curva (escala log, 2 séries) ──────────────────────────────────

function GraficoCurva({ curva, curvaCDI }) {
  const [hover, setHover] = useState(null)
  const W = 1000, H = 340
  const ml = 52, mr = 16, mt = 16, mb = 40
  const iw = W - ml - mr
  const ih = H - mt - mb

  const todos = curva.map(p => p.idx).concat(curvaCDI.map(p => p.idx))
  const min = Math.max(1, Math.min.apply(null, todos) * 0.94)
  const max = Math.max.apply(null, todos) * 1.06
  const lmin = Math.log10(min), lmax = Math.log10(max)

  const x = (i) => ml + (curva.length <= 1 ? 0 : (i / (curva.length - 1)) * iw)
  const y = (v) => mt + ih - ((Math.log10(Math.max(v, min)) - lmin) / (lmax - lmin)) * ih

  const linha = (arr) => arr.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.idx).toFixed(1)}`).join(' ')

  // ticks: potências e meios de década dentro do range
  const ticks = []
  for (const t of [100, 150, 200, 300, 400, 500, 700, 1000]) {
    if (t >= min && t <= max) ticks.push(t)
  }

  const rotulos = curva.map((p, i) => ({ i, mes: p.mes })).filter(({ mes }, k) => {
    const passo = Math.max(1, Math.ceil(curva.length / 8))
    return k % passo === 0 || k === curva.length - 1
  })

  const ptFinal = curva[curva.length - 1]
  const cdiFinal = curvaCDI[curvaCDI.length - 1]

  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 16px 10px' }}>
      {/* legenda — obrigatória com 2 séries */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 10, paddingLeft: 6, flexWrap: 'wrap' }}>
        <Legenda cor={s.accent} texto={`${PORTFOLIO_NOME} (conta real)`} />
        <Legenda cor={s.blue} texto="CDI (Banco Central)" tracejado />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}
        role="img" aria-label={`Curva de patrimônio do portfólio comparada ao CDI, ${curva.length} meses`}
        onMouseLeave={() => setHover(null)}>

        {/* grade */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={ml} y1={y(t)} x2={W - mr} y2={y(t)} stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
            <text x={ml - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill={s.muted}>{t}</text>
          </g>
        ))}

        {/* eixo x */}
        {rotulos.map(({ i, mes }) => (
          <text key={i} x={x(i)} y={H - 14} textAnchor="middle" fontSize="11" fill={s.muted}>
            {mesCurto(mes)}
          </text>
        ))}

        {/* CDI — tracejado, secundário */}
        <path d={linha(curvaCDI)} fill="none" stroke={s.blue} strokeWidth="2"
          strokeDasharray="6 5" strokeLinejoin="round" strokeLinecap="round" opacity=".9" />

        {/* portfólio */}
        <path d={linha(curva)} fill="none" stroke={s.accent} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* rótulo direto no fim de cada série */}
        <circle cx={x(curva.length - 1)} cy={y(ptFinal.idx)} r="4.5" fill={s.accent}
          stroke={s.card} strokeWidth="2" />
        <circle cx={x(curvaCDI.length - 1)} cy={y(cdiFinal.idx)} r="4" fill={s.blue}
          stroke={s.card} strokeWidth="2" />

        {/* camada de hover */}
        {curva.map((p, i) => (
          <rect key={i} x={x(i) - (iw / curva.length) / 2} y={mt}
            width={iw / curva.length} height={ih} fill="transparent"
            onMouseEnter={() => setHover(i)} />
        ))}

        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} y1={mt} x2={x(hover)} y2={mt + ih}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(curva[hover].idx)} r="4.5" fill={s.accent}
              stroke={s.card} strokeWidth="2" />
            <circle cx={x(hover)} cy={y(curvaCDI[hover].idx)} r="4" fill={s.blue}
              stroke={s.card} strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* tooltip em HTML, fora do SVG */}
      <div style={{ minHeight: 46, padding: '8px 8px 4px', display: 'flex', gap: 22,
        flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5 }}>
        {hover != null ? (
          <>
            <strong style={{ fontSize: 13 }}>{mesLegivel(curva[hover].mes)}</strong>
            <span><span style={{ color: s.muted }}>Portfólio </span>
              <strong style={{ color: s.accent }}>{curva[hover].idx.toFixed(1)}</strong></span>
            <span><span style={{ color: s.muted }}>CDI </span>
              <strong style={{ color: s.blue }}>{curvaCDI[hover].idx.toFixed(1)}</strong></span>
            <span><span style={{ color: s.muted }}>Mês </span>
              <strong style={{ color: curva[hover].resultado >= 0 ? s.pos : s.neg }}>
                {fmtR(curva[hover].resultado)}</strong></span>
            <span><span style={{ color: s.muted }}>Saldo </span>
              <strong>{fmtRc(curva[hover].saldo)}</strong></span>
          </>
        ) : (
          <span style={{ color: s.muted }}>
            Fim do período: portfólio <strong style={{ color: s.accent }}>{ptFinal.idx.toFixed(1)}</strong>
            {' · '}CDI <strong style={{ color: s.blue }}>{cdiFinal.idx.toFixed(1)}</strong>
            {'  — passe o mouse para ver mês a mês.'}
          </span>
        )}
      </div>
    </div>
  )
}

function Legenda({ cor, texto, tracejado }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: s.muted }}>
      <svg width="22" height="8" style={{ flexShrink: 0 }}>
        <line x1="0" y1="4" x2="22" y2="4" stroke={cor} strokeWidth="2.5"
          strokeDasharray={tracejado ? '5 4' : ''} strokeLinecap="round" />
      </svg>
      {texto}
    </span>
  )
}

// ── Calendário diário ────────────────────────────────────────────────────────

function CalendarioDoMes({ mes, dias }) {
  const [ano, m] = mes.split('-').map(Number)
  const primeiro = new Date(ano, m - 1, 1)
  const nDias = new Date(ano, m, 0).getDate()
  const offset = (primeiro.getDay() + 6) % 7 // segunda = 0

  const valores = Object.values(dias).map(Math.abs)
  const escala = valores.length ? Math.max.apply(null, valores) : 1
  const total = Object.values(dias).reduce((a, b) => a + b, 0)

  const celulas = []
  for (let i = 0; i < offset; i++) celulas.push(null)
  for (let d = 1; d <= nDias; d++) celulas.push(d)

  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
          <div key={d} style={{ fontSize: 10, color: s.muted, textAlign: 'center',
            letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {celulas.map((d, i) => {
          if (d == null) return <div key={i} />
          const v = dias[d]
          const temOp = v != null
          const intensidade = temOp ? Math.min(0.34, 0.08 + (Math.abs(v) / escala) * 0.26) : 0
          const cor = !temOp ? null : v > 0 ? s.pos : v < 0 ? s.neg : s.muted
          return (
            <div key={i} title={temOp ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}: ${fmtR(v)}` : ''}
              style={{ background: temOp ? hexA(cor, intensidade) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${temOp ? hexA(cor, 0.38) : s.border}`,
                borderRadius: 9, padding: '9px 6px', minHeight: 56,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, color: s.muted, fontWeight: 700 }}>{d}</div>
              {temOp && (
                <div style={{ fontSize: 11.5, fontWeight: 800, color: cor, textAlign: 'right',
                  lineHeight: 1.2, wordBreak: 'break-all' }}>
                  {(v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${s.border}`,
        display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: s.muted }}>
          {Object.keys(dias).length} pregão{Object.keys(dias).length === 1 ? '' : 's'} com operação
        </span>
        <span style={{ fontWeight: 800, color: total >= 0 ? s.pos : s.neg }}>
          {fmtR(total)}
        </span>
      </div>
    </div>
  )
}

// ── Auxiliares ───────────────────────────────────────────────────────────────

function Kpi({ rotulo, valor, cor, nota }) {
  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: s.muted, letterSpacing: '.06em',
        textTransform: 'uppercase', marginBottom: 6, minHeight: 26, lineHeight: 1.3 }}>{rotulo}</div>
      <div style={{ fontSize: 21, fontWeight: 900, color: cor || s.text,
        letterSpacing: '-0.02em' }}>{valor}</div>
      {nota && <div style={{ fontSize: 10.5, color: s.muted, marginTop: 4 }}>{nota}</div>}
    </div>
  )
}

function thStyle(right, w) {
  return {
    padding: '11px 10px', textAlign: right ? 'right' : 'left', fontSize: 10,
    letterSpacing: '.06em', textTransform: 'uppercase', color: s.muted,
    fontWeight: 700, whiteSpace: 'nowrap', width: w,
  }
}

function hexA(hex, a) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function mesLegivel(k) {
  if (!k) return ''
  const [a, m] = k.split('-')
  return `${MESES_LONGO[parseInt(m, 10) - 1]} de ${a}`
}

function mesCurto(k) {
  if (!k) return ''
  const [a, m] = k.split('-')
  return `${MESES[parseInt(m, 10) - 1]}/${a.slice(2)}`
}
