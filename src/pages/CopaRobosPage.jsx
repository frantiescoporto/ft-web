import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ============================================================================
 *  Copa dos Robôs — Série A e Série B (acesso e rebaixamento)
 *  NENHUM número é digitado: tudo vem da planilha (CSV).
 *  Colunas: ALGORÍTMO | SÉRIE (A/B) | RENTABILIDADE % | margem | resultado | <pregões DD/MM/AAAA...>
 *  Sobe 2 / cai 2: projeção pela posição atual dentro de cada série (se o mês fechasse hoje).
 * ========================================================================== */

const PLANILHA_ID = '1bGEBfwfMAkWp0r_6ahWmGyntEd_Cen7QyxhxpyCm0Ns'
const CSV_PUBLICADO = '' // ← cole aqui a URL do "Publicar na web → CSV" da aba do ranking, se quiser
const FONTES_CSV = [
  CSV_PUBLICADO,
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv`,
].filter(Boolean)

const WHATSAPP = 'https://wa.me/5553999010262?text=' + encodeURIComponent(
  'Olá Frantiesco! Vi a Copa dos Robôs no site e quero testar os robôs grátis por 30 dias.'
)
const COPA = { titulo: 'Copa dos Robôs', edicao: '1ª edição' }
const SOBEM = 2, CAEM = 2

/* ── leitura do CSV ── */
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false } else field += c }
    else if (c === '"') q = true
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
  let t = String(v).trim(); if (!t) return null
  const neg = t.indexOf('-') >= 0 || /^\(.*\)$/.test(t)
  t = t.replace(/[^0-9.,]/g, ''); if (!t) return null
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t); if (!isFinite(n)) return null
  return neg ? -Math.abs(n) : n
}
const ehSerie = (v) => { const t = String(v || '').trim().toUpperCase().replace(/[^AB]/g, ''); return (t === 'A' || t === 'B') ? t : null }
const fmtPct = (n) => n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
const fmtBRL = (n) => n == null ? '—' : (n < 0 ? '−' : '+') + 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function lerPlanilha(texto) {
  const rows = parseCSV(texto).filter(r => r.some(c => String(c).trim() !== ''))
  if (rows.length < 2) throw new Error('planilha vazia')
  const cab = rows[0]
  const idxDatas = cab.map((c, i) => EH_DATA.test(String(c).trim()) ? i : -1).filter(i => i >= 0)
  const primeiraData = idxDatas.length ? idxDatas[0] : cab.length

  const linhasRobo = rows.slice(1).filter(r => {
    const nome = String(r[0] || '').trim()
    if (!nome || /^https?:/i.test(nome)) return false
    for (let i = 1; i < cab.length; i++) if (toNum(r[i]) != null) return true
    return false
  })
  if (!linhasRobo.length) throw new Error('nenhum robô encontrado')

  const pre = []; for (let i = 1; i < primeiraData; i++) pre.push(i)
  const colSerie = pre.find(i => linhasRobo.filter(r => ehSerie(r[i])).length >= Math.max(1, linhasRobo.length * 0.5))
  const numericas = pre.filter(i => i !== colSerie)
  let colRent = numericas.find(i => String(linhasRobo[0][i] || '').indexOf('%') >= 0)
  if (colRent == null) colRent = numericas[0]
  const resto = numericas.filter(i => i !== colRent)
  const colMargem = resto[0], colResultado = resto[1]

  const robos = linhasRobo.map(r => {
    const serie = idxDatas.map(i => ({ data: String(cab[i]).trim(), valor: toNum(r[i]) })).filter(d => d.valor != null)
    const valores = serie.map(d => d.valor)
    return {
      robo: String(r[0]).trim(),
      serieRobo: colSerie != null ? ehSerie(r[colSerie]) : null,
      rent: toNum(r[colRent]),
      margem: colMargem == null ? null : toNum(r[colMargem]),
      resultado: colResultado == null ? null : toNum(r[colResultado]),
      serie, dias: serie.length,
      melhorDia: valores.length ? Math.max.apply(null, valores) : null,
      piorDia: valores.length ? Math.min.apply(null, valores) : null,
    }
  })
  const comDado = idxDatas.filter(i => linhasRobo.some(r => toNum(r[i]) != null))
  const periodo = comDado.length ? { inicio: String(cab[comDado[0]]).trim(), fim: String(cab[comDado[comDado.length - 1]]).trim(), pregoes: comDado.length } : null
  return { robos, periodo }
}

/* ── tira diária ── */
function Tira({ serie, escala, altura = 30 }) {
  if (!serie || !serie.length) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>sem pregões</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: altura }}>
      {serie.map((d, i) => {
        const h = escala > 0 ? Math.max(2, Math.abs(d.valor) / escala * (altura / 2 - 1)) : 2
        const pos = d.valor >= 0
        return (
          <div key={i} title={`${d.data}: ${fmtBRL(d.valor)}`} style={{ width: 6, height: altura, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: altura / 2, display: 'flex', alignItems: 'flex-end' }}>{pos && <div style={{ width: '100%', height: h, background: 'var(--pos)', borderRadius: 1 }} />}</div>
            <div style={{ height: altura / 2, display: 'flex', alignItems: 'flex-start' }}>{!pos && <div style={{ width: '100%', height: h, background: 'var(--neg)', borderRadius: 1 }} />}</div>
          </div>
        )
      })}
    </div>
  )
}

function Linha({ r, pos, escala, zona }) {
  const cor = zona === 'sobe' ? 'var(--pos)' : zona === 'cai' ? 'var(--neg)' : 'transparent'
  const bg = zona === 'sobe' ? 'rgba(55,226,155,.06)' : zona === 'cai' ? 'rgba(255,107,107,.06)' : 'transparent'
  return (
    <div className="copa-row" style={{ borderLeft: `3px solid ${cor}`, background: bg }}>
      <div className="copa-pos mono">{pos}</div>
      <div className="copa-nome">
        <span className="mono">{r.robo}</span>
        {zona === 'sobe' && <span className="copa-tag sobe">▲ sobe</span>}
        {zona === 'cai' && <span className="copa-tag cai">▼ cai</span>}
      </div>
      <div className="copa-tira"><Tira serie={r.serie} escala={escala} /></div>
      <div className="copa-rent mono" style={{ color: r.rent == null ? 'var(--muted)' : r.rent >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{fmtPct(r.rent)}</div>
    </div>
  )
}

export default function CopaRobosPage() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    const id = 'copa-fonts'
    if (!document.getElementById(id)) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => {
    if (!FONTES_CSV.length) { setErro('sem-csv'); return }
    let vivo = true
    ;(async () => {
      let ultimo = 'nenhuma fonte respondeu'
      for (const url of FONTES_CSV) {
        try {
          const r = await fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cb=' + Date.now())
          if (!r.ok) { ultimo = 'HTTP ' + r.status; continue }
          const lido = lerPlanilha(await r.text())
          if (!vivo) return
          setDados(lido); return
        } catch (e) { ultimo = String(e && e.message ? e.message : e) }
      }
      if (vivo) setErro(ultimo)
    })()
    return () => { vivo = false }
  }, [])

  const { serieA, serieB, escala, temSerie } = useMemo(() => {
    const robos = dados?.robos || []
    const sort = arr => arr.slice().sort((a, b) => (b.rent == null ? -1e9 : b.rent) - (a.rent == null ? -1e9 : a.rent))
    const A = sort(robos.filter(r => r.serieRobo === 'A'))
    const B = sort(robos.filter(r => r.serieRobo === 'B'))
    let m = 0; robos.forEach(r => r.serie.forEach(d => { m = Math.max(m, Math.abs(d.valor)) }))
    const tem = (A.length + B.length) > 0
    return { serieA: tem ? A : sort(robos), serieB: tem ? B : [], escala: m, temSerie: tem && B.length > 0 }
  }, [dados])

  const carregando = !dados && !erro

  return (
    <div className="copa">
      <style>{CSS}</style>

      <nav className="copa-nav">
        <button onClick={() => navigate('/')} className="copa-back">← Início</button>
        <span className="copa-brand">Frantiesco <span>Trader</span></span>
      </nav>

      {/* HERO */}
      <section className="copa-hero">
        <div className="copa-glow" />
        <div className="copa-in">
          <div className="copa-eyebrow">{COPA.titulo} · {COPA.edicao}</div>
          <h1 className="copa-h1">Duas séries.<br /><span className="g">Acesso e rebaixamento.</span></h1>
          <p className="copa-lede">
            {temSerie ? 'Série A e Série B, 12 robôs em cada. ' : 'Ranking dos robôs pela rentabilidade. '}
            A classificação é pela rentabilidade sobre a margem, e se o mês fechasse hoje os <b>{SOBEM} primeiros da Série B sobem</b> e os <b>{CAEM} últimos da Série A caem</b>.
          </p>
          {dados?.periodo && (
            <div className="copa-periodo mono">{dados.periodo.inicio} → {dados.periodo.fim} · {dados.periodo.pregoes} pregões</div>
          )}
        </div>
      </section>

      <div className="copa-wrap">
        {carregando && <p className="copa-msg">Carregando ranking…</p>}
        {erro && <div className="copa-warn">Não consegui ler a planilha agora. Verifique se ela está pública (Publicar na web → CSV) e a URL em <b>CSV_PUBLICADO</b>.</div>}

        {dados && (
          <>
            {/* SÉRIE A */}
            <div className="copa-serie-h">
              <span className="copa-serie-nome">Série A</span>
              <span className="copa-serie-meta mono">{serieA.length} robôs</span>
            </div>
            <div className="copa-board">
              {serieA.map((r, i) => (
                <Linha key={r.robo} r={r} pos={i + 1} escala={escala}
                  zona={temSerie && i >= serieA.length - CAEM ? 'cai' : null} />
              ))}
            </div>

            {/* DIVISOR DE TROCA */}
            {temSerie && (
              <div className="copa-swap">
                <span className="up">▲ {SOBEM} sobem</span>
                <span className="line" />
                <span className="down">▼ {CAEM} caem</span>
              </div>
            )}

            {/* SÉRIE B */}
            {temSerie && (
              <>
                <div className="copa-serie-h">
                  <span className="copa-serie-nome b">Série B</span>
                  <span className="copa-serie-meta mono">{serieB.length} robôs</span>
                </div>
                <div className="copa-board">
                  {serieB.map((r, i) => (
                    <Linha key={r.robo} r={r} pos={i + 1} escala={escala} zona={i < SOBEM ? 'sobe' : null} />
                  ))}
                </div>
              </>
            )}

            {/* METODOLOGIA */}
            <div className="copa-metod">
              <p className="copa-kick">Como funciona</p>
              <p className="copa-p">A nota de cada robô é a <b>rentabilidade sobre a margem</b> que a B3 exige para operá-lo, então dá pra comparar robôs que precisam de capitais diferentes. As barras do mês são os pregões: verde pra cima nos dias positivos, vermelho pra baixo nos negativos.</p>
              <p className="copa-p" style={{ color: 'var(--muted)', fontSize: 13 }}>A cada fechamento de mês, sobem {SOBEM} da Série B e caem {CAEM} da Série A. As marcações mostram como ficaria se o mês acabasse agora.</p>
            </div>

            {/* CTA */}
            <div className="copa-cta">
              <h2>Teste os robôs por 30 dias, de graça.</h2>
              <p>Contratação gratuita. Rode no seu Profit e decida com os resultados na mão.</p>
              <div className="copa-cta-row">
                <a className="btn grad" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Quero testar grátis</a>
                <a className="btn ghost" href="/resultado-do-mes" onClick={(e) => { e.preventDefault(); navigate('/resultado-do-mes') }}>Ver resultado do mês</a>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="copa-foot">
        <div>Frantiesco Trader · Método 6015</div>
        <div className="r">Resultados passados não garantem retornos futuros. Operar derivativos envolve risco.</div>
      </footer>
    </div>
  )
}

const CSS = `
.copa{ --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF; --pos:#37E29B; --neg:#FF6B6B;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.copa .mono{ font-family:'Geist Mono','SF Mono',monospace; font-variant-numeric:tabular-nums; }
.copa-wrap{ max-width:900px; margin:0 auto; padding:0 22px; }
.copa a{ color:inherit; text-decoration:none; }

.copa-nav{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
  padding:13px 22px; background:rgba(6,8,9,.65); backdrop-filter:saturate(160%) blur(16px); border-bottom:1px solid var(--line); }
.copa-back{ background:none; border:none; color:var(--muted); cursor:pointer; font-size:14px; font-family:inherit; }
.copa-brand{ font-weight:600; font-size:15px; letter-spacing:-.02em; }
.copa-brand span{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }

.copa-hero{ position:relative; text-align:center; padding:64px 22px 40px; }
.copa-glow{ position:absolute; left:50%; top:20px; width:820px; height:440px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(0,224,184,.24), rgba(56,198,255,.12) 45%, transparent 72%); filter:blur(26px); z-index:0; }
.copa-in{ position:relative; z-index:2; max-width:720px; margin:0 auto; }
.copa-eyebrow{ font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:18px; }
.copa-h1{ font-weight:600; font-size:clamp(36px,6.5vw,66px); line-height:.98; letter-spacing:-.04em; margin:0 0 18px; }
.copa-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.copa-lede{ color:var(--muted); font-size:17px; line-height:1.6; max-width:54ch; margin:0 auto 18px; }
.copa-lede b{ color:var(--text); }
.copa-periodo{ font-size:12.5px; color:var(--muted); letter-spacing:.04em; }

.copa-serie-h{ display:flex; align-items:baseline; gap:12px; margin:40px 0 12px; }
.copa-serie-nome{ font-weight:600; font-size:22px; letter-spacing:-.02em; }
.copa-serie-nome.b{ color:var(--text); }
.copa-serie-meta{ color:var(--muted); font-size:12px; letter-spacing:.08em; text-transform:uppercase; }

.copa-board{ background:var(--glass); border:1px solid var(--line); border-radius:16px; overflow:hidden; backdrop-filter:blur(12px); }
.copa-row{ display:grid; grid-template-columns:34px 1fr auto auto; align-items:center; gap:14px; padding:12px 16px; border-top:1px solid var(--line); }
.copa-row:first-child{ border-top:none; }
.copa-pos{ font-size:14px; color:var(--muted); text-align:center; }
.copa-nome{ display:flex; align-items:center; gap:9px; font-weight:600; font-size:15px; min-width:0; }
.copa-nome .mono{ font-size:15px; }
.copa-tag{ font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:2px 7px; border-radius:999px; white-space:nowrap; }
.copa-tag.sobe{ color:var(--pos); border:1px solid rgba(55,226,155,.4); }
.copa-tag.cai{ color:var(--neg); border:1px solid rgba(255,107,107,.4); }
.copa-tira{ justify-self:end; }
.copa-rent{ font-size:16px; font-weight:600; min-width:88px; text-align:right; }

.copa-swap{ display:flex; align-items:center; gap:14px; justify-content:center; padding:16px 0; font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
.copa-swap .up{ color:var(--pos); } .copa-swap .down{ color:var(--neg); }
.copa-swap .line{ flex:1; max-width:120px; height:1px; background:var(--line); }

.copa-metod{ margin:48px 0 0; background:var(--glass); border:1px solid var(--line); border-radius:16px; padding:24px; }
.copa-kick{ font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--cyanA); margin:0 0 12px; }
.copa-p{ color:var(--text); font-size:15px; line-height:1.6; margin:0 0 10px; }
.copa-p b{ color:var(--tealA); font-weight:600; }

.copa-cta{ text-align:center; padding:70px 0 40px; }
.copa-cta h2{ font-weight:600; font-size:clamp(26px,4vw,40px); letter-spacing:-.03em; margin:0 0 12px; }
.copa-cta p{ color:var(--muted); font-size:16px; margin:0 0 26px; }
.copa-cta-row{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.copa .btn{ font-weight:600; font-size:15px; padding:14px 28px; border-radius:999px; cursor:pointer; display:inline-block; }
.copa .btn.grad{ background:var(--grad); color:#04140f; box-shadow:0 12px 40px rgba(0,224,184,.24); }
.copa .btn.ghost{ background:var(--glass); border:1px solid var(--line); color:var(--text); }

.copa-msg{ color:var(--muted); text-align:center; padding:40px 0; }
.copa-warn{ background:var(--glass); border:1px solid rgba(245,166,35,.4); border-radius:12px; padding:18px; color:var(--muted); font-size:14px; margin-top:20px; }
.copa-foot{ text-align:center; padding:40px 22px 60px; color:var(--muted); font-size:12.5px; border-top:1px solid var(--line); margin-top:30px; }
.copa-foot .r{ margin-top:8px; font-size:11px; }

@media (max-width:640px){
  .copa-row{ grid-template-columns:26px 1fr auto; gap:10px; }
  .copa-tira{ display:none; }
}
`
