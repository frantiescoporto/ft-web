import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * CopaRobosPage.jsx — rota /copa-dos-robos
 *
 * Lê a planilha oficial da Copa dos Robôs (Google Sheets) e monta o ranking.
 * NENHUM número é digitado aqui: rentabilidade, margem, resultado e o dia a dia
 * vêm todos da planilha. O que a página calcula em cima disso (dias operados,
 * dias positivos, melhor/pior dia) é derivado da própria série diária.
 *
 * ── FORMATO ESPERADO DA PLANILHA ─────────────────────────────────────────────
 *   linha 1:  ALGORÍTMO | (vazio) | (vazio) | (vazio) | 03/08/2026 | 04/08/2026 | ...
 *   linha 2+: WIN_03    | 7,60%   | R$ 960  | R$ 73   | (result. do dia) | ...
 *
 *   col A  = nome do robô
 *   col B  = rentabilidade % no período  (é a coluna que define o ranking)
 *   col C  = margem exigida / garantia
 *   col D  = resultado acumulado em R$
 *   col E+ = resultado de cada pregão (célula vazia = não operou no dia)
 *
 *   As colunas de data são detectadas pelo formato DD/MM/AAAA no cabeçalho —
 *   pode adicionar pregões à direita que a página acompanha sozinha.
 *
 * ── SE O RANKING NÃO CARREGAR ────────────────────────────────────────────────
 *   A planilha precisa estar acessível publicamente. O caminho mais confiável é
 *   Arquivo → Compartilhar → Publicar na web → aba do ranking → CSV, e colar a
 *   URL gerada em CSV_PUBLICADO abaixo (ela tem prioridade sobre as outras).
 */

const PLANILHA_ID = '1bGEBfwfMAkWp0r_6ahWmGyntEd_Cen7QyxhxpyCm0Ns'
const CSV_PUBLICADO = '' // ← cole aqui a URL do "Publicar na web → CSV" se precisar

const FONTES_CSV = [
  CSV_PUBLICADO,
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv`,
].filter(Boolean)

const WHATSAPP = 'https://wa.me/5553999010262?text=' + encodeURIComponent(
  'Olá Frantiesco! Vi a Copa dos Robôs no site e quero assinar os robôs.'
)

const COPA = {
  titulo: 'Copa dos Robôs',
  edicao: '1ª edição',
}

const s = {
  accent: '#00d4aa',
  dark: '#080c12',
  surface: '#0f1520',
  card: '#131b28',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5',
  muted: '#6b7a99',
  warning: '#f5a623',
  purple: '#9b7cf4',
  pos: '#34d47e',
  neg: '#f06060',
}

const MEDALHAS = ['🥇', '🥈', '🥉']
const CORES_PODIO = [s.warning, '#c6d0e0', '#cd7f32']

// ── Leitura do CSV ───────────────────────────────────────────────────────────

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

const EH_DATA = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/

function toNum(v) {
  if (v == null) return null
  let t = String(v).trim()
  if (!t) return null
  const negativo = t.indexOf('-') >= 0 || /^\(.*\)$/.test(t)
  t = t.replace(/[^0-9.,]/g, '')
  if (!t) return null
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t)
  if (!isFinite(n)) return null
  return negativo ? -Math.abs(n) : n
}

const fmtBRL = (n) => n == null ? '—'
  : (n < 0 ? '-' : '+') + 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (n) => n == null ? '—'
  : (n > 0 ? '+' : n < 0 ? '-' : '') + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

const diaCurto = (d) => String(d || '').split('/').slice(0, 2).join('/')

function lerPlanilha(texto) {
  const rows = parseCSV(texto).filter(r => r.some(c => String(c).trim() !== ''))
  if (rows.length < 2) throw new Error('planilha vazia')

  const cab = rows[0]
  const idxDatas = cab.map((c, i) => EH_DATA.test(String(c).trim()) ? i : -1).filter(i => i >= 0)
  const primeiraData = idxDatas.length ? idxDatas[0] : cab.length

  const linhasRobo = rows.slice(1).filter(r => {
    const nome = String(r[0] || '').trim()
    if (!nome || /^https?:/i.test(nome)) return false
    return toNum(r[1]) != null || toNum(r[3]) != null
  })
  if (!linhasRobo.length) throw new Error('nenhum robo encontrado')

  // col da rentabilidade = a que traz "%"; as outras duas, na ordem da planilha,
  // são margem e resultado acumulado.
  const candidatas = []
  for (let i = 1; i < primeiraData; i++) candidatas.push(i)
  let colRent = candidatas.find(i => String(linhasRobo[0][i] || '').indexOf('%') >= 0)
  if (colRent == null) colRent = candidatas[0]
  const resto = candidatas.filter(i => i !== colRent)
  const colMargem = resto[0]
  const colResultado = resto[1]

  const robos = linhasRobo.map(r => {
    const serie = idxDatas
      .map(i => ({ data: String(cab[i]).trim(), valor: toNum(r[i]) }))
      .filter(d => d.valor != null)

    let acumulado = 0
    const curva = serie.map(d => { acumulado += d.valor; return { ...d, acumulado } })
    const positivos = serie.filter(d => d.valor > 0).length
    const negativos = serie.filter(d => d.valor < 0).length
    const valores = serie.map(d => d.valor)

    return {
      robo: String(r[0]).trim(),
      rentTexto: String(r[colRent] || '').trim(),
      rent: toNum(r[colRent]),
      margem: colMargem == null ? null : toNum(r[colMargem]),
      resultado: colResultado == null ? null : toNum(r[colResultado]),
      serie, curva, positivos, negativos,
      dias: serie.length,
      melhorDia: valores.length ? Math.max.apply(null, valores) : null,
      piorDia: valores.length ? Math.min.apply(null, valores) : null,
    }
  })

  const comDado = idxDatas.filter(i => linhasRobo.some(r => toNum(r[i]) != null))
  const periodo = comDado.length
    ? { inicio: String(cab[comDado[0]]).trim(), fim: String(cab[comDado[comDado.length - 1]]).trim(), pregoes: comDado.length }
    : null

  return { robos, periodo }
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function CopaRobosPage() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      let ultimoErro = 'nenhuma fonte configurada'
      for (const url of FONTES_CSV) {
        try {
          const r = await fetch(url)
          if (!r.ok) { ultimoErro = 'HTTP ' + r.status; continue }
          const txt = await r.text()
          const lido = lerPlanilha(txt)
          if (!vivo) return
          setDados(lido)
          return
        } catch (e) {
          ultimoErro = String(e && e.message ? e.message : e)
        }
      }
      if (vivo) setErro(ultimoErro)
    })()
    return () => { vivo = false }
  }, [])

  const ranking = useMemo(() => {
    if (!dados) return []
    return dados.robos.slice().sort((a, b) => {
      const x = a.rent == null ? -1e9 : a.rent
      const y = b.rent == null ? -1e9 : b.rent
      return y - x
    })
  }, [dados])

  // escala comum: todas as tirinhas diárias usam o mesmo eixo, senão a
  // comparação entre linhas mente.
  const escalaDia = useMemo(() => {
    let m = 0
    ranking.forEach(r => r.serie.forEach(d => { m = Math.max(m, Math.abs(d.valor)) }))
    return m || 1
  }, [ranking])

  const noPositivo = ranking.filter(r => r.rent != null && r.rent > 0).length

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 32px', textAlign: 'center' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: s.muted, fontSize: 13,
            cursor: 'pointer', marginBottom: 24, padding: 0 }}>
          ← voltar para a home
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          border: `1px solid ${s.warning}55`, borderRadius: 99, padding: '5px 16px',
          fontSize: 12, color: s.warning, fontWeight: 700, letterSpacing: '.08em',
          marginBottom: 24, background: `${s.warning}0d` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.warning,
            display: 'inline-block', boxShadow: `0 0 8px ${s.warning}` }} />
          AO VIVO · {COPA.edicao}
        </div>

        <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 900,
          lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 18 }}>
          {COPA.titulo}
          <br />
          <span style={{ color: s.accent }}>15 robôs, a mesma janela.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: s.muted,
          lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
          Todos rodando ao mesmo tempo, no mesmo período, com o resultado de cada pregão
          publicado. A classificação é pela <strong style={{ color: s.text }}>rentabilidade
          sobre a margem exigida</strong> — e muda a cada dia de mercado.
        </p>

        {dados && dados.periodo && (
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 10, marginTop: 26 }}>
            {[
              { r: 'Período', v: `${diaCurto(dados.periodo.inicio)} → ${diaCurto(dados.periodo.fim)}` },
              { r: 'Pregões', v: String(dados.periodo.pregoes) },
              { r: 'Robôs', v: String(ranking.length) },
              { r: 'No positivo', v: `${noPositivo} de ${ranking.length}` },
            ].map((c, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`,
                borderRadius: 10, padding: '10px 16px', textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: s.muted, letterSpacing: '.06em',
                  textTransform: 'uppercase' }}>{c.r}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{c.v}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ESTADOS ── */}
      {erro && (
        <section style={{ maxWidth: 760, margin: '0 auto 60px', padding: '0 32px' }}>
          <div style={{ background: s.card, border: `1px solid ${s.warning}44`,
            borderRadius: 14, padding: '28px 32px' }}>
            <div style={{ color: s.warning, fontWeight: 800, marginBottom: 10 }}>
              Não consegui carregar o ranking
            </div>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              A planilha precisa estar publicada. Vá em Arquivo → Compartilhar → Publicar na
              web → aba do ranking → CSV e cole a URL em <code style={{ color: s.accent }}>CSV_PUBLICADO</code>,
              no topo de <code style={{ color: s.accent }}>CopaRobosPage.jsx</code>.
              <br /><span style={{ fontSize: 12, opacity: .7 }}>Detalhe técnico: {erro}</span>
            </p>
          </div>
        </section>
      )}

      {!erro && !dados && (
        <section style={{ maxWidth: 1100, margin: '0 auto 60px', padding: '0 32px',
          textAlign: 'center', color: s.muted }}>
          Carregando o ranking...
        </section>
      )}

      {/* ── PÓDIO ── */}
      {ranking.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {ranking.slice(0, 3).map((r, i) => (
              <div key={r.robo}
                style={{ background: `linear-gradient(150deg, ${CORES_PODIO[i]}1f, ${s.card})`,
                  border: `1px solid ${CORES_PODIO[i]}55`, borderRadius: 16, padding: '26px 22px',
                  textAlign: 'center' }}>
                <div style={{ fontSize: 38, lineHeight: 1, marginBottom: 8 }}>{MEDALHAS[i]}</div>
                <div style={{ fontSize: 11, color: CORES_PODIO[i], fontWeight: 700,
                  letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {i + 1}º lugar
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{r.robo}</div>
                <div style={{ fontSize: 30, fontWeight: 900,
                  color: r.rent >= 0 ? s.pos : s.neg, letterSpacing: '-0.02em' }}>
                  {fmtPct(r.rent)}
                </div>
                <div style={{ fontSize: 12, color: s.muted, marginTop: 4, marginBottom: 16 }}>
                  {fmtBRL(r.resultado)} sobre {r.margem == null ? '—' : 'R$ ' + r.margem.toLocaleString('pt-BR')} de margem
                </div>
                <TiraDiaria serie={r.serie} escala={escalaDia} altura={34} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TABELA ── */}
      {ranking.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 20px' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 6 }}>
            Classificação
          </h2>
          <p style={{ color: s.muted, fontSize: 13, marginBottom: 20 }}>
            Clique em qualquer linha para abrir o relatório do robô, dia a dia.
            As barrinhas mostram o resultado de cada pregão — acima da linha positivo,
            abaixo negativo — todas na mesma escala.
          </p>

          <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: 13 }}>
              <thead>
                <tr style={{ background: s.surface }}>
                  <Th style={{ width: 54 }}>#</Th>
                  <Th>Robô</Th>
                  <Th right>Rentabilidade</Th>
                  <Th right>Resultado</Th>
                  <Th right>Margem</Th>
                  <Th right>Pregões</Th>
                  <Th>Dia a dia</Th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => {
                  const ativo = aberto === r.robo
                  return (
                    <React.Fragment key={r.robo}>
                      <tr onClick={() => setAberto(ativo ? null : r.robo)}
                        style={{ borderTop: `1px solid ${s.border}`, cursor: 'pointer',
                          background: ativo ? `${s.accent}0d` : 'transparent' }}>
                        <Td><span style={{ fontWeight: 800, color: i < 3 ? CORES_PODIO[i] : s.muted }}>
                          {i < 3 ? MEDALHAS[i] : i + 1}
                        </span></Td>
                        <Td><strong>{r.robo}</strong></Td>
                        <Td right cor={r.rent == null ? s.muted : r.rent >= 0 ? s.pos : s.neg}>
                          <strong>{fmtPct(r.rent)}</strong>
                        </Td>
                        <Td right cor={r.resultado == null ? s.muted : r.resultado >= 0 ? s.pos : s.neg}>
                          {fmtBRL(r.resultado)}
                        </Td>
                        <Td right muted>{r.margem == null ? '—' : 'R$ ' + r.margem.toLocaleString('pt-BR')}</Td>
                        <Td right muted>{r.dias}</Td>
                        <Td><TiraDiaria serie={r.serie} escala={escalaDia} altura={26} /></Td>
                      </tr>
                      {ativo && (
                        <tr style={{ background: `${s.accent}08` }}>
                          <td colSpan={7} style={{ padding: '16px 18px 24px' }}>
                            <RelatorioRobo r={r} posicao={i + 1} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── COMO FUNCIONA ── */}
      <section style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        borderBottom: `1px solid ${s.border}`, marginTop: 40 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 32px' }}>
          <div style={{ fontSize: 12, color: s.accent, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Como a Copa funciona
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 16 }}>
            Todo mundo na mesma régua.
          </h2>
          <p style={{ color: s.muted, fontSize: 15, lineHeight: 1.75, maxWidth: 720, marginBottom: 28 }}>
            Os robôs rodam simultaneamente, no mesmo período, cada um com a margem que a
            B3 exige para ele. A classificação é a rentabilidade sobre essa margem — assim
            um robô que precisa de menos capital para produzir o mesmo resultado aparece
            na frente, que é o que importa na hora de montar portfólio.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { t: 'Mesma janela', d: 'Nada de escolher o melhor período de cada robô. Todos são medidos exatamente nos mesmos pregões.' },
              { t: 'Resultado diário aberto', d: 'Cada pregão entra na planilha, positivo ou negativo. Abra qualquer robô e veja dia a dia.' },
              { t: 'Rentabilidade sobre a margem', d: 'Resultado dividido pela margem exigida do robô. Compara robôs que precisam de capitais diferentes.' },
              { t: 'Ranking ao vivo', d: 'A página lê a planilha oficial da Copa a cada acesso. O que está aqui é o que está lá — sem número digitado no site.' },
            ].map((c, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`,
                borderRadius: 12, padding: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: s.accent }}>{c.t}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.65 }}>{c.d}</div>
              </div>
            ))}
          </div>
          <p style={{ color: s.muted, fontSize: 12, lineHeight: 1.7, marginTop: 22, marginBottom: 0 }}>
            Uma janela curta de pregões mostra o momento de cada robô, não a qualidade dele no
            longo prazo. Para o histórico completo de cada estratégia, veja a página de{' '}
            <span onClick={() => navigate('/estrategias')}
              style={{ color: s.accent, cursor: 'pointer', textDecoration: 'underline' }}>estratégias</span>.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px' }}>
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '40px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: s.accent, fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              🤖 Assine os robôs
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 12 }}>
              Quer rodar os robôs da Copa na sua conta?
            </h2>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
              Chama no WhatsApp que eu te explico como funciona a assinatura, qual portfólio
              faz sentido para o seu capital e como colocar para rodar.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: s.accent, color: '#04140f', padding: '14px 28px',
                borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none',
                transition: 'opacity .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Falar no WhatsApp →
            </a>
          </div>
        </div>
      </section>

      {/* ── RISCO + FOOTER ── */}
      <footer style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        padding: '28px 32px', textAlign: 'center', color: s.muted, fontSize: 13 }}>
        <div style={{ maxWidth: 780, margin: '0 auto 10px', fontSize: 12, lineHeight: 1.7 }}>
          ⚠ Resultados passados não garantem resultados futuros. O período exibido é curto e
          não representa o comportamento de longo prazo das estratégias. Operações no mercado
          futuro envolvem risco, incluindo a possibilidade de perda do capital investido.
          Avalie seu perfil antes de investir.
        </div>
        <div>Frantiesco Trader · Método 6015</div>
      </footer>
    </div>
  )
}

// ── Gráfico: resultado por pregão ────────────────────────────────────────────
// Barras divergentes em torno da linha do zero. A direção (acima/abaixo) carrega
// o sinal junto com a cor, então continua legível para daltônicos e em P&B.

function TiraDiaria({ serie, escala, altura = 26, larguraBarra = 7, gap = 3 }) {
  if (!serie || !serie.length) {
    return <span style={{ fontSize: 11, color: s.muted }}>sem operações</span>
  }
  const largura = serie.length * (larguraBarra + gap) - gap
  const meio = altura / 2
  const maxAlt = meio - 1

  return (
    <svg width={largura} height={altura} style={{ display: 'block', overflow: 'visible' }}
      role="img" aria-label={`Resultado de ${serie.length} pregões`}>
      <line x1="0" y1={meio} x2={largura} y2={meio}
        stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {serie.map((d, i) => {
        const h = Math.max(2, Math.abs(d.valor) / escala * maxAlt)
        const positivo = d.valor >= 0
        const x = i * (larguraBarra + gap)
        const y = positivo ? meio - h : meio
        return (
          <rect key={i} x={x} y={y} width={larguraBarra} height={h} rx="2"
            fill={d.valor === 0 ? s.muted : positivo ? s.pos : s.neg}
            opacity={d.valor === 0 ? .45 : .9}>
            <title>{`${d.data}: ${fmtBRL(d.valor)}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

// ── Auxiliares ───────────────────────────────────────────────────────────────

function Th({ children, right, style }) {
  return (
    <th style={{ padding: '12px 14px', textAlign: right ? 'right' : 'left',
      fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
      color: s.muted, fontWeight: 700, whiteSpace: 'nowrap', ...(style || {}) }}>
      {children}
    </th>
  )
}

function Td({ children, right, muted, cor }) {
  return (
    <td style={{ padding: '12px 14px', textAlign: right ? 'right' : 'left',
      color: cor || (muted ? s.muted : s.text), whiteSpace: 'nowrap' }}>
      {children}
    </td>
  )
}

function RelatorioRobo({ r, posicao }) {
  const cards = [
    { r: 'Rentabilidade', v: fmtPct(r.rent), cor: r.rent == null ? null : r.rent >= 0 ? s.pos : s.neg },
    { r: 'Resultado', v: fmtBRL(r.resultado), cor: r.resultado == null ? null : r.resultado >= 0 ? s.pos : s.neg },
    { r: 'Margem exigida', v: r.margem == null ? '—' : 'R$ ' + r.margem.toLocaleString('pt-BR') },
    { r: 'Pregões operados', v: String(r.dias) },
    { r: 'Dias positivos', v: `${r.positivos} de ${r.dias}` },
    { r: 'Melhor pregão', v: fmtBRL(r.melhorDia), cor: s.pos },
    { r: 'Pior pregão', v: fmtBRL(r.piorDia), cor: r.piorDia != null && r.piorDia < 0 ? s.neg : null },
  ]

  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, color: s.muted, letterSpacing: '.08em',
        textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
        Relatório · {posicao}º colocado
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 18 }}>{r.robo}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: s.surface, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: s.muted, letterSpacing: '.05em',
              textTransform: 'uppercase', marginBottom: 5 }}>{c.r}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: c.cor || s.text }}>{c.v}</div>
          </div>
        ))}
      </div>

      {r.curva.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: s.muted, letterSpacing: '.06em',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
            Pregão a pregão
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 320 }}>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th right>Resultado</Th>
                  <Th right>Acumulado</Th>
                </tr>
              </thead>
              <tbody>
                {r.curva.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${s.border}` }}>
                    <Td muted>{d.data}</Td>
                    <Td right cor={d.valor > 0 ? s.pos : d.valor < 0 ? s.neg : s.muted}>{fmtBRL(d.valor)}</Td>
                    <Td right cor={d.acumulado >= 0 ? s.pos : s.neg}>{fmtBRL(d.acumulado)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
