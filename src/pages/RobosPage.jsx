import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ============================================================================
 *  Landing do Campeonato (Copa dos Robôs) — rota /lpcampeonato
 *  Identidade "Apple" do site.
 * ========================================================================== */

// >>> LINK DE ASSINATURA DOS ROBÔS (checkout Greenn) <<<
const LINK_ASSINAR = 'https://payfast.greenn.com.br/ug3vjsm'

// Planilha da Copa (mesma da /copa-dos-robos)
const PLANILHA_ID = '1bGEBfwfMAkWp0r_6ahWmGyntEd_Cen7QyxhxpyCm0Ns'
const CSV_URL = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv`

// >>> SALA DOS CAMPEÕES — um card por mês, TOP 3 (1º destaque, 2º e 3º menores).
//     Mês encerrado: top fixo. Mês corrente: { live:true } puxa o top 3 da Série A ao vivo.
const MESES = [
  {
    mes: 'Agosto/2026', status: 'Encerrado',
    top: [
      { robo: 'WIN_36', nick: 'Hunter / Sigurd', rent: '+30,15%' },
      { robo: 'WIN_22', nick: 'Ironflow',        rent: '+21,65%' },
      { robo: 'WIN_41', nick: 'Stikadinho',      rent: '+18,04%' },
    ],
  },
  { mes: 'Setembro/2026', status: 'Em andamento', live: true },
  { mes: 'Outubro/2026', status: 'A definir', top: [] },
]

const MEDALHAS = ['🥇', '🥈', '🥉']

/* ── CSV ── */
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
const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
function toPct(v) {
  let t = String(v || '').replace('%', '').trim(); if (!t) return null
  const neg = t.indexOf('-') >= 0
  t = t.replace(/[^0-9.,]/g, ''); if (!t) return null
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t); if (!isFinite(n)) return null
  return neg ? -Math.abs(n) : n
}
const fmtPct = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

export default function RobosPage() {
  const navigate = useNavigate()
  const [liveTop, setLiveTop] = useState(null) // null=carregando | []=falhou | [..]=ok

  useEffect(() => {
    const id = 'robos-fonts'
    if (!document.getElementById(id)) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  // top 3 da Série A ao vivo, da planilha da Copa
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const r = await fetch(CSV_URL + '&cb=' + Date.now())
        const rows = parseCSV(await r.text()).filter(x => x.some(c => String(c).trim() !== ''))
        const cab = rows[0].map(norm)
        const cRobo = 0
        const cNome = cab.indexOf('nome') >= 0 ? cab.indexOf('nome') : 1
        const cSerie = cab.findIndex(h => h.indexOf('serie') === 0)
        const cRent = cab.findIndex(h => h.indexOf('rentab') === 0)
        const lista = rows.slice(1)
          .filter(x => String(x[cRobo] || '').trim() && !/^https?:/i.test(String(x[cRobo])))
          .filter(x => cSerie < 0 || String(x[cSerie] || '').trim().toUpperCase() === 'A')
          .map(x => ({ robo: String(x[cRobo]).trim(), nick: String(x[cNome] || '').trim(), pct: toPct(x[cRent]) }))
          .filter(x => x.pct != null)
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 3)
          .map(x => ({ robo: x.robo, nick: x.nick, rent: fmtPct(x.pct) }))
        if (vivo) setLiveTop(lista)
      } catch { if (vivo) setLiveTop([]) }
    })()
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.rb .reveal')
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .16 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [liveTop])

  const go = (to) => (e) => { e.preventDefault(); navigate(to) }

  const renderPodio = (top) => (
    <>
      <div className="rb-camp">
        <div className="rb-camp-top">
          <span className="rb-camp-medal">🥇</span>
          <span className="rb-camp-robo mono">{top[0].robo}</span>
        </div>
        {top[0].nick && <div className="rb-camp-nick">{top[0].nick}</div>}
        <div className="rb-camp-rent mono">{top[0].rent}</div>
      </div>
      {top.slice(1).map((r, j) => (
        <div key={j} className="rb-run">
          <span className="rb-run-medal">{MEDALHAS[j + 1]}</span>
          <span className="rb-run-robo mono">{r.robo}</span>
          <span className="rb-run-nick">{r.nick}</span>
          <span className="rb-run-rent mono">{r.rent}</span>
        </div>
      ))}
    </>
  )

  return (
    <div className="rb">
      <style>{CSS}</style>

      <nav className="rb-nav">
        <button onClick={() => navigate('/')} className="rb-back">← Início</button>
        <span className="rb-brand">Frantiesco <span>Trader</span></span>
      </nav>

      {/* HERO */}
      <section className="rb-hero">
        <div className="rb-glow" />
        <div className="rb-in">
          <div className="rb-eyebrow">Copa dos Robôs · Método 6015</div>
          <h1 className="rb-h1">Assine os robôs<br /><span className="g">que competem de verdade.</span></h1>
          <p className="rb-lede">
            Não é promessa: é competição ao vivo. Todo mês os algoritmos disputam a maior rentabilidade,
            em duas séries com acesso e rebaixamento. Você assina e roda os mesmos robôs no seu Profit.
          </p>
          <div className="rb-cta">
            <a className="rb-btn grad" href={LINK_ASSINAR} target="_blank" rel="noopener noreferrer">Assinar os robôs</a>
            <a className="rb-btn ghost" href="/copa-dos-robos" onClick={go('/copa-dos-robos')}>Acompanhar o resultado do mês →</a>
          </div>
        </div>
      </section>

      {/* O QUE É O CAMPEONATO */}
      <section className="rb-sec"><div className="rb-wrap"><div className="rb-row reveal">
        <div className="rb-txt">
          <div className="rb-kick">O campeonato</div>
          <h2 className="rb-h2">Os robôs provam o valor no jogo, não no papel.</h2>
          <p className="rb-p">
            Cada algoritmo entra numa série e é ranqueado pela rentabilidade sobre a margem, mês a mês.
            Os melhores sobem, os piores caem. É a forma mais honesta de mostrar quais robôs merecem estar na sua carteira,
            porque a classificação vem do resultado real, à vista de todos.
          </p>
          <a className="rb-go" href="/copa-dos-robos" onClick={go('/copa-dos-robos')}><span className="a">Ver a Copa ao vivo →</span></a>
        </div>
        <div className="rb-card">
          <div className="rb-cbar"><span>Como funciona</span><span>2 séries</span></div>
          <div className="rb-mod"><span className="d" />Ranking pela rentabilidade sobre a margem</div>
          <div className="rb-mod"><span className="d" />Duas séries: acesso e rebaixamento a cada mês</div>
          <div className="rb-mod"><span className="d" />Resultado do mês aberto, robô a robô</div>
          <div className="rb-mod"><span className="d" />Você roda os mesmos robôs no seu Profit</div>
        </div>
      </div></div></section>

      {/* SALA DOS CAMPEÕES — 3 meses, top 3 (Série A) em cada */}
      <section className="rb-sec alt"><div className="rb-wrap">
        <div className="reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 34px' }}>
          <div className="rb-kick" style={{ justifyContent: 'center' }}>Sala dos campeões</div>
          <h2 className="rb-h2" style={{ textAlign: 'center' }}>Os campeões, mês a mês.</h2>
          <p className="rb-p" style={{ margin: '0 auto' }}>O pódio da Série A em cada edição da Copa 6015 — campeão em destaque e o restante do pódio.</p>
        </div>

        <div className="rb-meses reveal">
          {MESES.map((m, i) => {
            const st = m.status === 'Em andamento' ? 'and' : m.status === 'A definir' ? 'def' : 'end'
            const top = m.live ? liveTop : m.top
            return (
              <div key={i} className={`rb-mes ${(!m.live && (!top || top.length === 0)) ? 'vazio' : ''}`}>
                <div className="rb-mes-head">
                  <span className="rb-mes-nome mono">{m.mes}</span>
                  <span className={`rb-tag ${st}`}>{m.status}</span>
                </div>

                {m.live ? (
                  liveTop === null ? (
                    <div className="rb-mes-def"><div className="rb-def-tro">🏆</div><div>carregando…</div></div>
                  ) : liveTop.length === 0 ? (
                    <div className="rb-mes-def"><div className="rb-def-tro">🏆</div><div>ranking indisponível</div></div>
                  ) : renderPodio(liveTop)
                ) : (top && top.length > 0) ? (
                  renderPodio(top)
                ) : (
                  <div className="rb-mes-def"><div className="rb-def-tro">🏆</div><div>a definir</div></div>
                )}
              </div>
            )
          })}
        </div>
      </div></section>

      {/* RESULTADO DO MÊS (CTA) */}
      <section className="rb-sec"><div className="rb-wrap">
        <div className="rb-band reveal">
          <div>
            <div className="rb-kick">Ao vivo</div>
            <h2 className="rb-h2" style={{ marginBottom: 8 }}>Acompanhe o resultado do mês.</h2>
            <p className="rb-p" style={{ margin: 0 }}>O ranking atualizado da Copa, com o desempenho de cada robô no mês corrente.</p>
          </div>
          <a className="rb-btn grad" href="/copa-dos-robos" onClick={go('/copa-dos-robos')} style={{ flexShrink: 0 }}>Ver resultado do mês →</a>
        </div>
      </div></section>

      {/* CTA FINAL */}
      <section className="rb-final reveal">
        <h2>Coloque os campeões pra operar por você.</h2>
        <p>Assinatura dos robôs da Copa, prontos pra rodar no seu Profit.</p>
        <a className="rb-btn grad big" href={LINK_ASSINAR} target="_blank" rel="noopener noreferrer">Assinar os robôs</a>
      </section>

      <footer className="rb-foot">
        <div>Frantiesco Trader · Método 6015</div>
        <div className="r">Resultados passados não garantem retornos futuros. Operar derivativos envolve risco, inclusive de perda.</div>
      </footer>
    </div>
  )
}

const CSS = `
.rb{ --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF; --pos:#37E29B; --neg:#FF6B6B;
  --gold:#FFC53D;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.rb .mono{ font-family:'Geist Mono','SF Mono',monospace; font-variant-numeric:tabular-nums; }
.rb-wrap{ max-width:1000px; margin:0 auto; padding:0 22px; }
.rb a{ color:inherit; text-decoration:none; }

.rb-nav{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
  padding:13px 22px; background:rgba(6,8,9,.65); backdrop-filter:saturate(160%) blur(16px); border-bottom:1px solid var(--line); }
.rb-back{ background:none; border:none; color:var(--muted); cursor:pointer; font-size:14px; font-family:inherit; }
.rb-brand{ font-weight:600; font-size:15px; letter-spacing:-.02em; }
.rb-brand span{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }

.rb-hero{ position:relative; text-align:center; padding:74px 22px 54px; }
.rb-glow{ position:absolute; left:50%; top:20px; width:860px; height:460px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(0,224,184,.26), rgba(56,198,255,.13) 45%, transparent 72%); filter:blur(26px); z-index:0; }
.rb-in{ position:relative; z-index:2; max-width:760px; margin:0 auto; }
.rb-eyebrow{ font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:18px; }
.rb-h1{ font-weight:600; font-size:clamp(38px,7vw,72px); line-height:.98; letter-spacing:-.04em; margin:0 0 18px; }
.rb-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.rb-lede{ color:var(--muted); font-size:18px; line-height:1.6; max-width:54ch; margin:0 auto 30px; }
.rb-cta{ display:flex; gap:13px; justify-content:center; flex-wrap:wrap; }
.rb-btn{ font-weight:600; font-size:16px; padding:15px 30px; border-radius:999px; cursor:pointer; display:inline-block; transition:transform .12s; }
.rb-btn.grad{ background:var(--grad); color:#04140f; box-shadow:0 12px 40px rgba(0,224,184,.26); }
.rb-btn.grad:hover{ transform:translateY(-2px); }
.rb-btn.ghost{ background:var(--glass); border:1px solid var(--line); color:var(--text); }
.rb-btn.big{ font-size:18px; padding:18px 40px; }

.rb-sec{ padding:96px 0; }
.rb-sec.alt{ background:rgba(255,255,255,.015); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.rb-row{ display:grid; grid-template-columns:1fr 1fr; gap:52px; align-items:center; }
.rb-kick{ display:flex; font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--cyanA); margin-bottom:16px; }
.rb-h2{ font-weight:600; font-size:clamp(26px,4vw,44px); letter-spacing:-.035em; line-height:1.06; margin:0 0 16px; }
.rb-p{ color:var(--muted); font-size:17px; line-height:1.6; margin:0 0 24px; max-width:46ch; }
.rb-go{ font-weight:600; font-size:16px; display:inline-flex; }
.rb-go .a{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }

.rb-card{ background:var(--glass); border:1px solid var(--line); border-radius:22px; backdrop-filter:blur(16px); padding:24px; box-shadow:0 30px 90px rgba(0,0,0,.4); }
.rb-cbar{ display:flex; justify-content:space-between; font-family:'Geist Mono',monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:16px; }
.rb-mod{ display:flex; align-items:center; gap:12px; padding:12px 0; border-top:1px solid var(--line); font-size:15px; }
.rb-mod .d{ width:7px; height:7px; border-radius:50%; background:var(--tealA); box-shadow:0 0 8px var(--tealA); flex:none; }

/* sala dos campeões — 3 meses, top 3 em cada */
.rb-meses{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; align-items:start; }
.rb-mes{ background:var(--glass); border:1px solid var(--line); border-radius:18px; padding:22px; display:flex; flex-direction:column; }
.rb-mes.vazio{ border-style:dashed; opacity:.7; }
.rb-mes-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.rb-mes-nome{ font-size:14px; font-weight:600; }
.rb-tag{ font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
.rb-tag.and{ color:var(--cyanA); border-color:rgba(56,198,255,.4); }
.rb-tag.end{ color:var(--gold); border-color:rgba(255,197,61,.4); }

.rb-camp{ background:linear-gradient(180deg, rgba(255,197,61,.10), transparent); border:1px solid rgba(255,197,61,.4); border-radius:14px; padding:16px; text-align:center; margin-bottom:12px; }
.rb-camp-top{ display:flex; align-items:center; justify-content:center; gap:8px; }
.rb-camp-medal{ font-size:26px; }
.rb-camp-robo{ font-size:22px; font-weight:700; }
.rb-camp-nick{ color:var(--muted); font-size:12px; margin-top:3px; }
.rb-camp-rent{ font-size:26px; font-weight:700; color:var(--pos); margin-top:8px; }

.rb-run{ display:flex; align-items:center; gap:9px; padding:9px 4px; border-top:1px solid var(--line); font-size:13px; color:var(--muted); }
.rb-run-medal{ font-size:15px; filter:saturate(.5); }
.rb-run-robo{ font-weight:600; color:var(--text); }
.rb-run-nick{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rb-run-rent{ font-weight:600; }

.rb-mes-def{ flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--muted); padding:24px 0; }
.rb-def-tro{ font-size:34px; filter:grayscale(1); opacity:.5; }

.rb-band{ display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap;
  background:var(--glass); border:1px solid var(--line); border-radius:22px; padding:32px; backdrop-filter:blur(16px); }

.rb-final{ text-align:center; padding:110px 22px; }
.rb-final h2{ font-weight:600; font-size:clamp(28px,4.5vw,48px); letter-spacing:-.035em; margin:0 0 12px; }
.rb-final p{ color:var(--muted); font-size:17px; margin:0 0 28px; }
.rb-foot{ text-align:center; padding:40px 22px 60px; color:var(--muted); font-size:12.5px; border-top:1px solid var(--line); }
.rb-foot .r{ margin-top:8px; font-size:11px; max-width:60ch; margin-left:auto; margin-right:auto; }

.rb .reveal{ opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease; }
.rb .reveal.in{ opacity:1; transform:none; }
.rb a:focus-visible, .rb .rb-btn:focus-visible, .rb-back:focus-visible{ outline:2px solid var(--cyanA); outline-offset:3px; }

@media (max-width:760px){
  .rb-row{ grid-template-columns:1fr; gap:28px; }
  .rb-meses{ grid-template-columns:1fr; }
  .rb-band{ flex-direction:column; align-items:flex-start; }
}
@media (prefers-reduced-motion:reduce){ .rb *{ animation:none !important; } .rb .reveal{ opacity:1; transform:none; transition:none; } }
`
