import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ============================================================================
 *  Landing do Campeonato (Copa dos Robôs) — rota /lpcampeonato
 *  Identidade "Apple" do site.
 * ========================================================================== */

// >>> LINK DE ASSINATURA DOS ROBÔS (checkout Greenn) <<<
const LINK_ASSINAR = 'https://payfast.greenn.com.br/ug3vjsm'

// >>> PÓDIO DA COPA (medalhistas do mês) — ordem: 1º, 2º, 3º
const PODIO_TITULO = 'Pódio da Copa 6015 · Agosto/2026'
const PODIO = [
  { pos: 1, medal: '🥇', robo: 'WIN_36', nick: 'Hunter / Sigurd', rent: '+30,15%' },
  { pos: 2, medal: '🥈', robo: 'WIN_22', nick: 'Ironflow',        rent: '+21,65%' },
  { pos: 3, medal: '🥉', robo: 'WIN_41', nick: 'Stikadinho',      rent: '+18,04%' },
]

// >>> SALA DOS CAMPEÕES — campeão de cada mês (mais recente primeiro; mostra só o que existir)
const CAMPEOES_MENSAIS = [
  { mes: 'Agosto/2026', robo: 'WIN_36', nick: 'Hunter / Sigurd', rent: '+30,15%' },
]

export default function RobosPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = 'robos-fonts'
    if (!document.getElementById(id)) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.rb .reveal')
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .16 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])

  const go = (to) => (e) => { e.preventDefault(); navigate(to) }

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

      {/* PÓDIO DA COPA (1º, 2º, 3º em ordem) */}
      {PODIO.length > 0 && (
        <section className="rb-sec alt"><div className="rb-wrap">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
            <div className="rb-kick" style={{ justifyContent: 'center' }}>{PODIO_TITULO}</div>
            <h2 className="rb-h2" style={{ textAlign: 'center' }}>O pódio da rodada.</h2>
            <p className="rb-p" style={{ margin: '0 auto' }}>Os 3 robôs de maior rentabilidade no fechamento do mês, em conta real.</p>
          </div>
          <div className="rb-podio reveal">
            {PODIO.map((c) => (
              <div key={c.pos} className={`rb-pcard rank${c.pos}`}>
                <div className="rb-prow">
                  <span className="rb-medal">{c.medal}</span>
                  <span className="rb-ppos mono">{c.pos}º</span>
                </div>
                <div className="rb-probo mono">{c.robo}</div>
                <div className="rb-pnick">{c.nick}</div>
                <div className="rb-prent mono">{c.rent}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <a className="rb-go" href="/copa-dos-robos" onClick={go('/copa-dos-robos')}><span className="a">Ver a classificação completa →</span></a>
          </div>
        </div></section>
      )}

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

      {/* SALA DOS CAMPEÕES (campeão de cada mês) */}
      {CAMPEOES_MENSAIS.length > 0 && (
        <section className="rb-sec alt"><div className="rb-wrap">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 34px' }}>
            <div className="rb-kick" style={{ justifyContent: 'center' }}>Sala dos campeões</div>
            <h2 className="rb-h2" style={{ textAlign: 'center' }}>Quem levou a taça, mês a mês.</h2>
            <p className="rb-p" style={{ margin: '0 auto' }}>O grande campeão de cada edição da Copa 6015.</p>
          </div>
          <div className="rb-sala reveal">
            {CAMPEOES_MENSAIS.slice(0, 3).map((c, i) => (
              <div key={i} className="rb-scard">
                <div className="rb-smes mono">{c.mes}</div>
                <div className="rb-strophy">🏆</div>
                <div className="rb-srobo mono">{c.robo}</div>
                <div className="rb-snick">{c.nick}</div>
                <div className="rb-srent mono">{c.rent}</div>
              </div>
            ))}
          </div>
        </div></section>
      )}

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
  --gold:#FFC53D; --silver:#C9D2DD; --bronze:#E0A878;
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

/* pódio: 1º, 2º, 3º em ordem, mesma altura */
.rb-podio{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.rb-pcard{ background:var(--glass); border:1px solid var(--line); border-radius:18px; padding:24px 20px; text-align:center; }
.rb-pcard.rank1{ border-color:rgba(255,197,61,.55); box-shadow:0 20px 60px rgba(255,197,61,.12); }
.rb-pcard.rank2{ border-color:rgba(201,210,221,.4); }
.rb-pcard.rank3{ border-color:rgba(224,168,120,.4); }
.rb-prow{ display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px; }
.rb-medal{ font-size:38px; line-height:1; }
.rb-ppos{ font-size:13px; color:var(--muted); }
.rb-probo{ font-size:22px; font-weight:600; }
.rb-pnick{ color:var(--muted); font-size:13px; margin-top:4px; }
.rb-prent{ font-size:26px; font-weight:600; color:var(--pos); margin-top:12px; }
.rb-pcard.rank1 .rb-prent{ font-size:30px; }

/* sala dos campeões */
.rb-sala{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; max-width:760px; margin:0 auto; }
.rb-scard{ background:var(--glass); border:1px solid rgba(255,197,61,.35); border-radius:18px; padding:24px 20px; text-align:center; }
.rb-smes{ font-size:12px; color:var(--muted); letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
.rb-strophy{ font-size:38px; line-height:1; }
.rb-srobo{ font-size:22px; font-weight:600; margin-top:10px; }
.rb-snick{ color:var(--muted); font-size:13px; margin-top:4px; }
.rb-srent{ font-size:24px; font-weight:600; color:var(--pos); margin-top:10px; }

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
  .rb-podio{ grid-template-columns:1fr; }
  .rb-band{ flex-direction:column; align-items:flex-start; }
}
@media (prefers-reduced-motion:reduce){ .rb *{ animation:none !important; } .rb .reveal{ opacity:1; transform:none; transition:none; } }
`
