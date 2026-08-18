import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * ResultadoDoMesPage.jsx — rota /resultado-do-mes
 *
 * Acompanhamento do resultado dos robôs, dia a dia, lido de uma planilha Google
 * publicada como CSV. Nenhum número é digitado no código.
 *
 * ── CONFIGURAR ───────────────────────────────────────────────────────────────
 * 1) Na planilha: Arquivo → Compartilhar → Publicar na web → aba do resultado
 *    diário → CSV. Cole a URL em CSV_PUBLICADO (ou deixe vazio e a página tenta
 *    ler direto pelo PLANILHA_ID).
 *
 * ── FORMATO DA PLANILHA ──────────────────────────────────────────────────────
 *   Linha 1:  ALGORÍTMO | (total) | 03/08/2026 | 04/08/2026 | ...
 *   Linhas:   WIN_03    | -R$ 63  |            |            | R$ 27 | ...
 *
 *   - Coluna A: nome do robô.
 *   - Coluna B (cabeçalho vazio): total do robô. A página NÃO usa esse número
 *     para somar — ela soma os dias. Serve só de conferência: se a soma dos
 *     dias não bater com essa coluna, a página avisa na tela.
 *   - Demais colunas: um pregão cada, resultado FINANCEIRO do dia (R$).
 *     Célula vazia = não operou.
 *   - Basta acrescentar colunas de data à direita. A página detecta os meses
 *     sozinha e abre no mais recente — a URL nunca muda.
 *
 *   Colunas OPCIONAIS, se um dia você quiser: `ativo`, `lotes`, `valor_ponto`.
 *   Existindo, mandam mais que a convenção de nome abaixo.
 *
 * ── PONTOS ───────────────────────────────────────────────────────────────────
 *   A planilha só traz o financeiro. Os pontos vêm de:
 *       pontos = financeiro ÷ (valor do ponto × lotes)
 *   O ativo sai do prefixo do nome do robô (WIN_ → WINFUT, WDO_ → WDOFUT...)
 *   e o valor do ponto da tabela VALOR_PONTO abaixo. Ativo sem valor de ponto
 *   preenchido aparece só com o financeiro.
 *
 * IMPORTANTE: esta página mostra o que está na planilha. Ela não é tempo real
 * e não deve ser anunciada como tal — o topo informa o último pregão lançado.
 */

const PLANILHA_ID = '1wPENWZ_fyFQG7PiIoG0KHeKoR0ejn3hJAo4MoAyc3yY'
const CSV_PUBLICADO = '' // ← URL do "Publicar na web → CSV", se precisar

// Aba da planilha com o link de assinatura individual de cada robô.
// Formato:  codigo do robo | link | nome (opcional)
//   WIN_03 | https://nelogica.com.br/... | Nome comercial
// Robô sem link fica opaco na tabela, com "em breve" no lugar do botão.
const ABA_LINKS = 'links'
const CSV_LINKS_PUBLICADO = '' // ← URL do CSV publicado DESSA aba, se precisar

const FONTES_LINKS = [
  CSV_LINKS_PUBLICADO,
  PLANILHA_ID && `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(ABA_LINKS)}`,
].filter(Boolean)

// Assinatura dos robôs (mesmo checkout usado na página da Copa)
const LINK_ASSINATURA = 'https://payfast.greenn.com.br/gs8wdp6'
const WHATSAPP = 'https://wa.me/5553999010262?text=' + encodeURIComponent(
  'Olá Frantiesco! Vi o resultado dos robôs no site e quero saber mais sobre a assinatura.'
)

const FONTES_CSV = [
  CSV_PUBLICADO,
  PLANILHA_ID && `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv`,
  PLANILHA_ID && `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv`,
].filter(Boolean)

// Ativo deduzido do prefixo do nome do robô
const ATIVO_POR_PREFIXO = {
  WIN: 'WINFUT', WDO: 'WDOFUT', BIT: 'BITFUT', WSP: 'WSPFUT',
}

// Quanto vale 1 ponto do ativo, por contrato (especificação do contrato na B3).
// WINFUT e WDOFUT conferidos contra o histórico real do Frantiesco.
// Para mostrar pontos de um ativo novo, basta acrescentar a linha aqui.
const VALOR_PONTO = {
  WINFUT: 0.20,
  WDOFUT: 10.00,
  // BITFUT: preencher quando entrar robô de bitcoin na planilha
}

function ativoDoRobo(nome) {
  const pref = String(nome || '').split('_')[0].toUpperCase()
  return ATIVO_POR_PREFIXO[pref] || ''
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
  pos: '#34d47e',
  neg: '#f06060',
}

const MESES_LONGO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── CSV ──────────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
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
  return rows.filter(r => r.some(c => String(c).trim() !== ''))
}

const EH_DATA = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/

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

const semAcento = (v) => String(v == null ? '' : v).toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

function acharCol(cab, nomes) {
  const cols = cab.map(semAcento)
  for (const n of nomes) {
    const i = cols.indexOf(n)
    if (i >= 0) return i
  }
  for (const n of nomes) {
    const i = cols.findIndex(c => c && c.indexOf(n) === 0)
    if (i >= 0) return i
  }
  return null
}

function lerPlanilha(texto) {
  const rows = parseCSV(texto)
  if (rows.length < 2) throw new Error('planilha vazia')
  const cab = rows[0]

  const colunasData = []
  cab.forEach((c, i) => {
    const m = EH_DATA.exec(String(c).trim())
    if (!m) return
    const dia = m[1].padStart(2, '0')
    const mes = m[2].padStart(2, '0')
    const ano = m[3].length === 2 ? '20' + m[3] : m[3]
    colunasData.push({ i, dia: +dia, chaveMes: `${ano}-${mes}`, chaveDia: `${ano}-${mes}-${dia}` })
  })
  if (!colunasData.length) throw new Error('nenhuma coluna de data no cabecalho')

  const cRobo = acharCol(cab, ['robo', 'algoritmo', 'nome', 'estrategia']) ?? 0
  const cAtivo = acharCol(cab, ['ativo', 'papel', 'contrato'])
  const cLotes = acharCol(cab, ['lotes', 'lote', 'contratos', 'qtd'])
  const cPonto = acharCol(cab, ['valorponto', 'valordoponto', 'pontovalor'])
  // nome comercial do robô, se a planilha trouxer numa coluna própria
  let cNome = acharCol(cab, ['nome', 'apelido', 'nomedorobo', 'nomecomercial'])
  if (cNome === cRobo) cNome = null

  // coluna de total: a primeira coluna sem papel definido antes da 1ª data
  const primeiraData = colunasData[0].i
  let cTotal = null
  for (let i = 0; i < primeiraData; i++) {
    if (i !== cRobo && i !== cAtivo && i !== cLotes && i !== cPonto && i !== cNome) { cTotal = i; break }
  }

  const robos = []
  const divergencias = []
  rows.slice(1).forEach(r => {
    const nome = String(r[cRobo] || '').trim()
    if (!nome || /^https?:/i.test(nome)) return

    const ativo = (cAtivo != null && String(r[cAtivo] || '').trim()) || ativoDoRobo(nome)
    const lotes = (cLotes == null ? null : toNum(r[cLotes])) || 1
    const daPlanilha = cPonto == null ? null : toNum(r[cPonto])
    const valorPonto = daPlanilha != null ? daPlanilha : (VALOR_PONTO[ativo] != null ? VALOR_PONTO[ativo] : null)

    const dias = {}
    colunasData.forEach(cd => {
      const v = toNum(r[cd.i])
      if (v == null) return
      dias[cd.chaveDia] = {
        financeiro: v,
        pontos: valorPonto && valorPonto > 0 ? v / (valorPonto * lotes) : null,
      }
    })
    // conferência contra a coluna de total da planilha
    if (cTotal != null) {
      const totalPlanilha = toNum(r[cTotal])
      if (totalPlanilha != null) {
        const soma = Object.keys(dias).reduce((a, k) => a + dias[k].financeiro, 0)
        if (Math.abs(soma - totalPlanilha) > 0.01) {
          divergencias.push({ robo: nome, planilha: totalPlanilha, soma })
        }
      }
    }

    robos.push({ nome, apelido: cNome == null ? '' : String(r[cNome] || '').trim(),
      ativo, lotes, valorPonto, dias })
  })
  if (!robos.length) throw new Error('nenhum robo encontrado')

  const meses = [...new Set(colunasData.map(c => c.chaveMes))].sort()
  const diasPorMes = {}
  colunasData.forEach(c => {
    if (!diasPorMes[c.chaveMes]) diasPorMes[c.chaveMes] = []
    diasPorMes[c.chaveMes].push(c)
  })

  // último pregão que realmente tem lançamento
  let ultimoDia = null
  colunasData.forEach(c => {
    if (robos.some(r => r.dias[c.chaveDia])) ultimoDia = c.chaveDia
  })

  return { robos, meses, diasPorMes, ultimoDia, divergencias }
}

function lerLinks(texto) {
  const rows = parseCSV(texto)
  const mapa = {}
  rows.forEach(r => {
    const codigo = String(r[0] || '').trim()
    if (!codigo) return
    // pula uma eventual linha de cabeçalho
    const c = semAcento(codigo)
    if (c === 'robo' || c === 'algoritmo' || c === 'codigo' || c === 'estrategia') return
    const link = String(r[1] || '').trim()
    const nome = String(r[2] || '').trim()
    mapa[codigo.toUpperCase()] = {
      link: /^https?:\/\//i.test(link) ? link : '',
      nome,
    }
  })
  return mapa
}

// ── Formatação ───────────────────────────────────────────────────────────────

const sinal = (n) => n > 0 ? '+' : n < 0 ? '-' : ''
const fmtRS = (n) => n == null ? '—' : sinal(n) + 'R$ ' +
  Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtRSc = (n) => n == null ? '—' : sinal(n) + 'R$ ' +
  Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const fmtPT = (n) => n == null ? '—' : sinal(n) +
  Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' pts'

const rotuloMes = (k) => {
  if (!k) return ''
  const [a, m] = k.split('-')
  return `${MESES_LONGO[+m - 1]} de ${a}`
}
const rotuloDia = (k) => {
  if (!k) return ''
  const [a, m, d] = k.split('-')
  return `${d}/${m}/${a}`
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ResultadoDoMesPage() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [links, setLinks] = useState(null)
  const [erro, setErro] = useState(null)
  const [mesSel, setMesSel] = useState(null)
  const [diaSel, setDiaSel] = useState(null)
  const [unidade, setUnidade] = useState('financeiro') // 'financeiro' | 'pontos'

  useEffect(() => {
    if (!FONTES_CSV.length) { setErro('sem-csv'); return }
    let vivo = true
    ;(async () => {
      let ultimo = 'nenhuma fonte respondeu'
      for (const url of FONTES_CSV) {
        try {
          const r = await fetch(url)
          if (!r.ok) { ultimo = 'HTTP ' + r.status; continue }
          const lido = lerPlanilha(await r.text())
          if (!vivo) return
          setDados(lido)
          return
        } catch (e) { ultimo = String(e && e.message ? e.message : e) }
      }
      if (vivo) setErro(ultimo)
    })()

    // aba de links — falha aqui não quebra a página, só some o botão de assinar
    ;(async () => {
      for (const url of FONTES_LINKS) {
        try {
          const r = await fetch(url)
          if (!r.ok) continue
          const mapa = lerLinks(await r.text())
          if (!vivo) return
          if (Object.keys(mapa).length) { setLinks(mapa); return }
        } catch (e) { /* segue sem links */ }
      }
    })()

    return () => { vivo = false }
  }, [])

  const mes = mesSel || (dados && dados.meses.length ? dados.meses[dados.meses.length - 1] : null)

  const resumo = useMemo(() => {
    if (!dados || !mes) return null
    const colunas = dados.diasPorMes[mes] || []
    const porDia = {}
    colunas.forEach(c => {
      let fin = 0, pts = 0, temFin = false, temPts = false, robos = 0
      dados.robos.forEach(r => {
        const d = r.dias[c.chaveDia]
        if (!d) return
        robos++
        fin += d.financeiro; temFin = true
        if (d.pontos != null) { pts += d.pontos; temPts = true }
      })
      if (robos) porDia[c.chaveDia] = { dia: c.dia, financeiro: temFin ? fin : null, pontos: temPts ? pts : null, robos }
    })

    const chaves = Object.keys(porDia).sort()
    const totalFin = chaves.reduce((a, k) => a + (porDia[k].financeiro || 0), 0)
    const totalPts = chaves.reduce((a, k) => a + (porDia[k].pontos || 0), 0)
    const positivos = chaves.filter(k => porDia[k].financeiro > 0).length
    const fins = chaves.map(k => porDia[k].financeiro).filter(v => v != null)

    // ranking do mês: quem operou vem ordenado pelo resultado; logo abaixo,
    // os robôs disponíveis para assinatura que não operaram no período.
    const avaliados = dados.robos.map(r => {
      let fin = 0, pts = 0, dias = 0, temPts = false, ganhos = 0
      colunas.forEach(c => {
        const d = r.dias[c.chaveDia]
        if (!d) return
        dias++
        fin += d.financeiro
        if (d.financeiro > 0) ganhos++
        if (d.pontos != null) { pts += d.pontos; temPts = true }
      })
      const info = links ? links[r.nome.toUpperCase()] : null
      return { ...r, fin, pts: temPts ? pts : null, dias, ganhos,
        link: info && info.link ? info.link : '',
        apelido: (info && info.nome) || r.apelido || '' }
    })

    const operaram = avaliados.filter(r => r.dias > 0).sort((a, b) => b.fin - a.fin)
    const paradosComLink = avaliados
      .filter(r => r.dias === 0 && r.link)
      .sort((a, b) => a.nome.localeCompare(b.nome))
    const ranking = operaram.concat(paradosComLink)

    return {
      porDia, chaves, totalFin, totalPts,
      temPts: chaves.some(k => porDia[k].pontos != null),
      dias: chaves.length, positivos,
      melhor: fins.length ? Math.max.apply(null, fins) : null,
      pior: fins.length ? Math.min.apply(null, fins) : null,
      ranking, nOperaram: operaram.length,
    }
  }, [dados, mes, links])

  const diaAberto = diaSel && resumo && resumo.porDia[diaSel] ? diaSel : null
  const ehPontos = unidade === 'pontos'
  const fmt = ehPontos ? fmtPT : fmtRS
  const fmtCurto = ehPontos ? fmtPT : fmtRSc
  const valorDe = (o) => o == null ? null : (ehPontos ? o.pontos : o.financeiro)

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 24px' }}>
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
          ACOMPANHAMENTO DIÁRIO · CONTA REAL
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 4.6vw, 52px)', fontWeight: 900,
          lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 14 }}>
          Resultado dos robôs,<br />
          <span style={{ color: s.accent }}>pregão por pregão.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', color: s.muted,
          lineHeight: 1.7, maxWidth: 640, marginBottom: 0 }}>
          Clique em qualquer dia do calendário para ver quanto cada robô fez naquele
          pregão, em pontos e em reais.
          {dados && dados.ultimoDia && (
            <> Último pregão lançado: <strong style={{ color: s.text }}>{rotuloDia(dados.ultimoDia)}</strong>.</>
          )}
        </p>
      </section>

      {/* ── ERRO / CARREGANDO ── */}
      {erro && (
        <section style={{ maxWidth: 760, margin: '0 auto 60px', padding: '0 32px' }}>
          <div style={{ background: s.card, border: `1px solid ${s.warning}44`,
            borderRadius: 14, padding: '28px 32px' }}>
            <div style={{ color: s.warning, fontWeight: 800, marginBottom: 10 }}>
              {erro === 'sem-csv' ? 'Planilha ainda não conectada' : 'Não consegui carregar o resultado'}
            </div>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Publique a aba do resultado diário (Arquivo → Compartilhar → Publicar na web →
              CSV) e cole a URL em <code style={{ color: s.accent }}>CSV_PUBLICADO</code>, no
              topo de <code style={{ color: s.accent }}>ResultadoDoMesPage.jsx</code>.
              {erro !== 'sem-csv' && <><br /><span style={{ fontSize: 12, opacity: .7 }}>Detalhe técnico: {erro}</span></>}
            </p>
          </div>
        </section>
      )}

      {!erro && !dados && (
        <section style={{ maxWidth: 1100, margin: '0 auto 60px', padding: '0 32px', color: s.muted }}>
          Carregando...
        </section>
      )}

      {/* conferência: soma dos dias x coluna de total da planilha */}
      {dados && dados.divergencias && dados.divergencias.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 32px 0' }}>
          <div style={{ background: `${s.warning}12`, border: `1px solid ${s.warning}44`,
            borderRadius: 12, padding: '14px 18px', fontSize: 12.5, color: s.warning, lineHeight: 1.6 }}>
            <strong>Conferir planilha:</strong> em {dados.divergencias.length} rob{dados.divergencias.length === 1 ? 'ô' : 'ôs'} a
            soma dos pregões não bate com a coluna de total —{' '}
            {dados.divergencias.slice(0, 4).map(d => `${d.robo} (total ${fmtRS(d.planilha)}, soma ${fmtRS(d.soma)})`).join(' · ')}
            {dados.divergencias.length > 4 ? ' ...' : ''}. A página está somando os pregões.
          </div>
        </section>
      )}

      {dados && resumo && (
        <>
          {/* ── CONTROLES ── */}
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 32px 0',
            display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center',
            justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {dados.meses.map(m => (
                <button key={m} onClick={() => { setMesSel(m); setDiaSel(null) }}
                  style={{ background: m === mes ? `${s.accent}1a` : s.card,
                    border: `1px solid ${m === mes ? s.accent : s.border}`,
                    color: m === mes ? s.accent : s.muted, borderRadius: 99,
                    padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {rotuloMes(m)}
                </button>
              ))}
            </div>

            {resumo.temPts && (
              <div style={{ display: 'flex', background: s.card, border: `1px solid ${s.border}`,
                borderRadius: 99, padding: 3 }}>
                {[['financeiro', 'R$'], ['pontos', 'Pontos']].map(([k, rot]) => (
                  <button key={k} onClick={() => setUnidade(k)}
                    style={{ background: unidade === k ? s.accent : 'transparent',
                      color: unidade === k ? '#04140f' : s.muted, border: 'none',
                      borderRadius: 99, padding: '7px 18px', fontSize: 13,
                      fontWeight: 800, cursor: 'pointer' }}>
                    {rot}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── KPIs ── */}
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))', gap: 12 }}>
              <Kpi rotulo={`Resultado de ${MESES_LONGO[+mes.split('-')[1] - 1]}`}
                valor={ehPontos ? fmtPT(resumo.totalPts) : fmtRSc(resumo.totalFin)}
                cor={resumo.totalFin >= 0 ? s.pos : s.neg}
                nota={resumo.temPts ? (ehPontos ? fmtRSc(resumo.totalFin) : fmtPT(resumo.totalPts)) : null} />
              <Kpi rotulo="Pregões no mês" valor={String(resumo.dias)} />
              <Kpi rotulo="Dias positivos" valor={`${resumo.positivos} de ${resumo.dias}`}
                cor={resumo.positivos >= resumo.dias / 2 ? s.pos : null} />
              <Kpi rotulo="Melhor dia" valor={fmtRSc(resumo.melhor)} cor={s.pos} />
              <Kpi rotulo="Pior dia" valor={fmtRSc(resumo.pior)} cor={s.neg} />
              <Kpi rotulo="Robôs no mês" valor={String(resumo.nOperaram)} />
            </div>
          </section>

          {/* ── CALENDÁRIO ── */}
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 0' }}>
            <h2 style={{ fontSize: 'clamp(19px, 2.4vw, 26px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 6 }}>
              {rotuloMes(mes)}
            </h2>
            <p style={{ color: s.muted, fontSize: 13, marginBottom: 18 }}>
              Clique em um dia para abrir o resultado de cada robô naquele pregão.
            </p>
            <Calendario mes={mes} porDia={resumo.porDia} diaSel={diaAberto}
              onDia={(k) => setDiaSel(k === diaSel ? null : k)}
              valorDe={valorDe} fmtCurto={fmtCurto} />
          </section>

          {/* ── DETALHE DO DIA ── */}
          {diaAberto && (
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 0' }}>
              <DetalheDoDia dia={diaAberto} robos={dados.robos} total={resumo.porDia[diaAberto]}
                ehPontos={ehPontos} onFechar={() => setDiaSel(null)} />
            </section>
          )}

          {/* ── RANKING DO MÊS ── */}
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 32px 0' }}>
            <h2 style={{ fontSize: 'clamp(19px, 2.4vw, 26px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 6 }}>
              Como cada robô foi no mês
            </h2>
            <p style={{ color: s.muted, fontSize: 13, marginBottom: 18 }}>
              Acumulado de {rotuloMes(mes).toLowerCase()}, do melhor para o pior.
              {links && ' Dá para assinar cada robô separadamente — os que ainda não estão disponíveis aparecem esmaecidos, e os que não operaram no mês ficam no fim da lista.'}
            </p>
            <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: s.surface }}>
                    <Th style={{ width: 46 }}>#</Th>
                    <Th>Robô</Th>
                    <Th>Ativo</Th>
                    <Th right>Pregões</Th>
                    <Th right>Dias +</Th>
                    {resumo.temPts && <Th right>Pontos</Th>}
                    <Th right>Financeiro</Th>
                    {links && <Th right>Assinar</Th>}
                  </tr>
                </thead>
                <tbody>
                  {resumo.ranking.map((r, i) => (
                    <tr key={r.nome} style={{ borderTop: `1px solid ${s.border}`,
                      opacity: links && !r.link ? 0.5 : 1,
                      background: r.dias === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <Td muted>{r.dias === 0 ? '–' : i + 1}</Td>
                      <Td>
                        <strong>{r.nome}</strong>
                        {r.apelido && (
                          <span style={{ color: s.muted, fontWeight: 400 }}> · {r.apelido}</span>
                        )}
                      </Td>
                      <Td muted>{r.ativo || '—'}</Td>
                      <Td right muted>{r.dias === 0 ? '—' : r.dias}</Td>
                      <Td right muted>{r.dias === 0 ? '—' : r.ganhos}</Td>
                      {resumo.temPts && (
                        <Td right cor={r.dias === 0 || r.pts == null ? s.muted : r.pts >= 0 ? s.pos : s.neg}>
                          {r.dias === 0 || r.pts == null ? '—' : fmtPT(r.pts)}
                        </Td>
                      )}
                      <Td right cor={r.dias === 0 ? s.muted : r.fin >= 0 ? s.pos : s.neg}>
                        {r.dias === 0 ? 'não operou' : <strong>{fmtRS(r.fin)}</strong>}
                      </Td>
                      {links && (
                        <Td right>
                          {r.link ? (
                            <a href={r.link} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-block', background: `${s.accent}1a`,
                                border: `1px solid ${s.accent}55`, color: s.accent,
                                borderRadius: 8, padding: '6px 14px', fontSize: 12,
                                fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
                                transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = s.accent; e.currentTarget.style.color = '#04140f' }}
                              onMouseLeave={e => { e.currentTarget.style.background = `${s.accent}1a`; e.currentTarget.style.color = s.accent }}>
                              Assinar →
                            </a>
                          ) : (
                            <span style={{ fontSize: 11.5, color: s.muted }}>em breve</span>
                          )}
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ── CTA DE ASSINATURA ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 32px 0' }}>
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '36px 40px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: s.accent, fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              🤖 Assine os robôs
            </div>
            <h2 style={{ fontSize: 'clamp(21px, 2.8vw, 30px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 12 }}>
              Quer esses robôs rodando na sua conta?
            </h2>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
              São os mesmos robôs que você está vendo aqui, pregão a pregão, já com a
              configuração que eu uso. Ficou dúvida antes de assinar, é só me chamar.
            </p>
          </div>
          <div style={{ flexShrink: 0, display: 'grid', gap: 10 }}>
            <a href={LINK_ASSINATURA} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: s.accent, color: '#04140f', padding: '15px 30px',
                borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none',
                boxSizing: 'border-box', transition: 'opacity .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Assinar os robôs →
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', color: s.text, padding: '13px 30px',
                border: `1px solid ${s.border}`, borderRadius: 10, fontWeight: 700,
                fontSize: 14, textDecoration: 'none', boxSizing: 'border-box',
                transition: 'all .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.color = s.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.text }}>
              Tirar dúvida no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── RODAPÉ ── */}
      <footer style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        padding: '28px 32px', textAlign: 'center', color: s.muted, fontSize: 13, marginTop: 52 }}>
        <div style={{ maxWidth: 800, margin: '0 auto 10px', fontSize: 12, lineHeight: 1.7 }}>
          ⚠ Resultados de conta real, lançados manualmente a cada pregão — esta página reflete
          o último lançamento, não a posição em tempo real do mercado. Resultados passados não
          garantem resultados futuros. Operações no mercado futuro envolvem risco, incluindo a
          possibilidade de perda do capital investido.
        </div>
        <div>Frantiesco Trader · Método 6015</div>
      </footer>
    </div>
  )
}

// ── Calendário do mês ────────────────────────────────────────────────────────

function Calendario({ mes, porDia, diaSel, onDia, valorDe, fmtCurto }) {
  const [ano, m] = mes.split('-').map(Number)
  const nDias = new Date(ano, m, 0).getDate()
  const offset = (new Date(ano, m - 1, 1).getDay() + 6) % 7

  const escala = Math.max(1, ...Object.values(porDia)
    .map(d => Math.abs(d.financeiro || 0)))

  const celulas = []
  for (let i = 0; i < offset; i++) celulas.push(null)
  for (let d = 1; d <= nDias; d++) celulas.push(d)

  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ fontSize: 10, color: s.muted, textAlign: 'center',
            letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {celulas.map((d, i) => {
          if (d == null) return <div key={i} />
          const chave = `${mes}-${String(d).padStart(2, '0')}`
          const info = porDia[chave]
          const temOp = !!info
          const fin = temOp ? info.financeiro : null
          const cor = !temOp ? null : fin > 0 ? s.pos : fin < 0 ? s.neg : s.muted
          const inten = temOp ? Math.min(0.32, 0.07 + (Math.abs(fin) / escala) * 0.25) : 0
          const sel = diaSel === chave
          const v = valorDe(info)
          return (
            <div key={i} onClick={() => temOp && onDia(chave)}
              style={{ background: temOp ? corA(cor, inten) : 'rgba(255,255,255,0.02)',
                border: sel ? `2px solid ${s.accent}` : `1px solid ${temOp ? corA(cor, 0.38) : s.border}`,
                borderRadius: 10, padding: sel ? '8px 5px' : '9px 6px', minHeight: 66,
                cursor: temOp ? 'pointer' : 'default', transition: 'transform .12s',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, color: s.muted, fontWeight: 700 }}>{d}</div>
              {temOp && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: cor, lineHeight: 1.2 }}>
                    {fmtCurto(v)}
                  </div>
                  <div style={{ fontSize: 9.5, color: s.muted, marginTop: 2 }}>
                    {info.robos} robô{info.robos === 1 ? '' : 's'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Detalhe de um dia ────────────────────────────────────────────────────────

function DetalheDoDia({ dia, robos, total, ehPontos, onFechar }) {
  const linhas = robos
    .map(r => ({ nome: r.nome, ativo: r.ativo, lotes: r.lotes, ...(r.dias[dia] || {}) }))
    .filter(l => l.financeiro != null)
    .sort((a, b) => b.financeiro - a.financeiro)

  const temPts = linhas.some(l => l.pontos != null)

  return (
    <div style={{ background: s.card, border: `1px solid ${s.accent}44`, borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: s.accent, letterSpacing: '.08em',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Pregão de {rotuloDia(dia)}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900,
            color: total.financeiro >= 0 ? s.pos : s.neg, letterSpacing: '-0.02em' }}>
            {ehPontos && total.pontos != null ? fmtPT(total.pontos) : fmtRS(total.financeiro)}
          </div>
          {total.pontos != null && (
            <div style={{ fontSize: 12.5, color: s.muted, marginTop: 2 }}>
              {ehPontos ? fmtRS(total.financeiro) : fmtPT(total.pontos)} · {linhas.length} robô{linhas.length === 1 ? '' : 's'} operando
            </div>
          )}
        </div>
        <button onClick={onFechar}
          style={{ background: 'none', border: `1px solid ${s.border}`, color: s.muted,
            borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
          fechar
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460, fontSize: 13 }}>
          <thead>
            <tr>
              <Th>Robô</Th>
              <Th>Ativo</Th>
              <Th right>Lotes</Th>
              {temPts && <Th right>Pontos</Th>}
              <Th right>Financeiro</Th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.nome} style={{ borderTop: `1px solid ${s.border}` }}>
                <Td><strong>{l.nome}</strong></Td>
                <Td muted>{l.ativo || '—'}</Td>
                <Td right muted>{l.lotes}</Td>
                {temPts && (
                  <Td right cor={l.pontos == null ? s.muted : l.pontos >= 0 ? s.pos : s.neg}>
                    {l.pontos == null ? '—' : fmtPT(l.pontos)}
                  </Td>
                )}
                <Td right cor={l.financeiro >= 0 ? s.pos : s.neg}>
                  <strong>{fmtRS(l.financeiro)}</strong>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Auxiliares ───────────────────────────────────────────────────────────────

function Kpi({ rotulo, valor, cor, nota }) {
  return (
    <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '15px 17px' }}>
      <div style={{ fontSize: 10, color: s.muted, letterSpacing: '.06em',
        textTransform: 'uppercase', marginBottom: 6, minHeight: 26, lineHeight: 1.3 }}>{rotulo}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: cor || s.text, letterSpacing: '-0.02em' }}>{valor}</div>
      {nota && <div style={{ fontSize: 10.5, color: s.muted, marginTop: 4 }}>{nota}</div>}
    </div>
  )
}

function Th({ children, right, style }) {
  return (
    <th style={{ padding: '11px 13px', textAlign: right ? 'right' : 'left', fontSize: 10,
      letterSpacing: '.06em', textTransform: 'uppercase', color: s.muted,
      fontWeight: 700, whiteSpace: 'nowrap', ...(style || {}) }}>{children}</th>
  )
}

function Td({ children, right, muted, cor }) {
  return (
    <td style={{ padding: '11px 13px', textAlign: right ? 'right' : 'left',
      color: cor || (muted ? s.muted : s.text), whiteSpace: 'nowrap' }}>{children}</td>
  )
}

function corA(hex, a) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}
