import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { buildAdjOps, calcMetrics, fmtNum } from '../lib/analytics.js'
import { fmtMoeda, capitalDoNome, RX_DOOPRIME } from '../lib/moeda.js'
import { getConfigVersions, parseRobots } from '../lib/publico.js'

/* ============================================================================
 *  Mercado Internacional · DooPrime + Black Arrow
 *  Produto: robôs de ouro, índices e forex, em dólar, liberados sem custo
 *  pra quem abre a conta na DooPrime pelo link do Frantiesco.
 *
 *  Dados: robots.json (plataforma blackarrow). Os ids em LIBERADOS são as
 *  estratégias já liberadas; os demais robôs blackarrow aparecem como
 *  "em validação". Portfólios DOO_PRIME | XXX (XXX = capital em dólar) são
 *  lidos do mentorados-portfolios.json e aparecem sozinhos quando existirem.
 * ========================================================================== */

const LINK_CONTA = 'https://my.dooprime.com/pt/links/go/71702'
const LINK_GRUPO = 'https://chat.whatsapp.com/BlnnTR5yZ9SLvV9XgwMd7e'
const WHATSAPP = 'https://wa.me/5553999010262?text=' + encodeURIComponent('Olá Frantiesco! Abri minha conta na DooPrime pelo seu link e quero receber os robôs de mercado internacional.')

// ids (robots.json) das estratégias liberadas hoje
const LIBERADOS = [140, 141, 144]

const VANTAGENS = [
  { t: 'Execução rápida', d: 'Latência baixa, o que importa pra day trade e scalper.' },
  { t: 'Vários mercados', d: 'Forex, índices, commodities, ações e criptomoedas na mesma conta.' },
  { t: 'Black Arrow a partir de US$ 130', d: 'A plataforma de automação da Nelogica pro mercado internacional.' },
  { t: 'Swap free nos principais pares', d: 'Sem custo de rolagem nos pares de forex mais operados.' },
  { t: '7 dias sem swap em ouro', d: 'E em outros ativos selecionados.' },
  { t: 'Alavancagem competitiva', d: 'Margem menor por contrato do que na B3.' },
  { t: 'VPS gratuita', d: 'Pra depósitos a partir de US$ 1.000. Robô rodando 24h sem depender do seu computador.' },
  { t: 'Suporte dedicado', d: 'WhatsApp e chat 24/7.' },
]

const ATIVO_NOME = { XAUUSD: 'Ouro', USDJPY: 'Dólar / Iene', SP500: 'S&P 500', NAS100: 'Nasdaq 100', HK50: 'Hang Seng' }
const nomeAtivo = (a) => ATIVO_NOME[String(a || '').toUpperCase().replace(/[^A-Z0-9]/g, '')] || a || ''

function metricasDoRobo(r) {
  if (!r.operations?.length) return null
  const adj = buildAdjOps(r.operations, r.desagio || 0, r.tipo || 'backtest')
  const m = calcMetrics(adj)
  const meses = {}
  adj.forEach(o => { const p = (o.abertura || '').split(' ')[0].split('/'); const k = `${p[2]}-${p[1]}`; meses[k] = (meses[k] || 0) + o.resAdj })
  const v = Object.values(meses)
  const ini = (r.operations[0]?.abertura || '').split(' ')[0]
  const fim = (r.operations[r.operations.length - 1]?.abertura || '').split(' ')[0]
  return { ...m, mediaMes: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, nMeses: v.length, ini, fim, nReal: r.realOps?.length || 0 }
}

const mesAno = (d) => { const p = (d || '').split('/'); return p.length === 3 ? `${p[1]}/${p[2].slice(2)}` : '' }

export default function MercadoInternacionalPage() {
  const { robots, mentPortfolios, mentOps, loading } = useData()

  useEffect(() => {
    const els = document.querySelectorAll('.mi .reveal')
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .12 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [loading])

  const { liberados, validacao } = useMemo(() => {
    const ba = (robots || []).filter(r => String(r.platform || '').toLowerCase() === 'blackarrow')
    const lib = LIBERADOS.map(id => ba.find(r => r.id === id)).filter(Boolean).map(r => ({ r, m: metricasDoRobo(r) }))
    const val = ba.filter(r => !LIBERADOS.includes(r.id)).sort((a, b) => a.name.localeCompare(b.name))
    return { liberados: lib, validacao: val }
  }, [robots])

  const portfolios = useMemo(() => {
    const opsByName = {}
    ;(mentOps || []).forEach(op => { (opsByName[op.ativo] || (opsByName[op.ativo] = [])).push(op) })
    return (mentPortfolios || []).filter(p => RX_DOOPRIME.test(p.name || '')).map(p => {
      const cv = getConfigVersions(p).slice().sort((a, b) => String(b.valid_from || '').localeCompare(String(a.valid_from || '')))
      const robos = parseRobots(cv[0]?.robots_json)
      const ops = robos.flatMap(r => (opsByName[r.name] || []).map(o => ({ ...o, res_op: (o.res_op || 0) * (r.lotes || 1) })))
      const total = ops.reduce((s, o) => s + (o.res_op || 0), 0)
      const capital = capitalDoNome(p.name) || parseFloat(p.capital_inicial) || 0
      return { p, robos, nOps: ops.length, total, capital, pct: capital > 0 && ops.length ? (total / capital) * 100 : null }
    }).sort((a, b) => a.capital - b.capital)
  }, [mentPortfolios, mentOps])

  return (
    <div className="mi">
      <style>{CSS}</style>

      {/* HERO */}
      <section className="mi-hero">
        <div className="mi-glow" />
        <div className="mi-wrap mi-hero-in">
          <div className="mi-eyebrow">Mercado internacional · DooPrime</div>
          <h1 className="mi-h1">Robôs em dólar.<br /><span className="g">Grátis com a sua conta.</span></h1>
          <p className="mi-lede">Ouro, índices e forex operados por robôs Black Arrow. Quem abre a conta na DooPrime pelo meu link recebe as estratégias sem pagar licença.</p>
          <div className="mi-cta">
            <a className="mi-btn grad" href={LINK_CONTA} target="_blank" rel="noopener noreferrer">Abrir conta na DooPrime</a>
            <a className="mi-btn ghost" href={LINK_GRUPO} target="_blank" rel="noopener noreferrer">Entrar no grupo de Forex</a>
          </div>
        </div>
        <div className="mi-wrap">
          <div className="mi-specs reveal">
            <div className="mi-spec"><div className="v mono">{loading ? '—' : liberados.length}</div><div className="k">Estratégias liberadas</div></div>
            <div className="mi-spec"><div className="v mono">{loading ? '—' : validacao.length}</div><div className="k">Em validação</div></div>
            <div className="mi-spec"><div className="v mono">US$ 130</div><div className="k">Black Arrow, a partir de</div></div>
            <div className="mi-spec"><div className="v mono">24h</div><div className="k">VPS grátis a partir de US$ 1.000</div></div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mi-sec"><div className="mi-wrap"><div className="mi-row">
        <div className="mi-txt reveal">
          <div className="mi-kick">Como funciona</div>
          <h2 className="mi-h2">Três passos. Nenhum custo de licença.</h2>
          <p className="mi-p">Os robôs são os mesmos que eu valido no Trade Quant Lab, com a configuração pronta. A conta é sua, na DooPrime, e o dinheiro fica com você.</p>
          <a className="mi-go" href={LINK_CONTA} target="_blank" rel="noopener noreferrer"><span className="a">Abrir a conta agora →</span></a>
        </div>
        <div className="mi-card reveal">
          <div className="mi-cbar"><span>O passo a passo</span><span>3 etapas</span></div>
          <div className="mi-steps">
            <div className="mi-step"><span className="n">01</span><div className="t">Abrir a conta</div><div className="dsc">Pelo link desta página, pra que a conta fique vinculada e os robôs sejam liberados.</div></div>
            <div className="mi-step"><span className="n">02</span><div className="t">Me avisar</div><div className="dsc">No WhatsApp ou no grupo de Forex. Eu confirmo a conta e libero o acesso.</div></div>
            <div className="mi-step"><span className="n">03</span><div className="t">Instalar no Black Arrow</div><div className="dsc">Estratégias, lotes e horários já configurados. Você liga e acompanha.</div></div>
          </div>
        </div>
      </div></div></section>

      {/* ESTRATÉGIAS */}
      <section className="mi-sec" id="estrategias"><div className="mi-wrap">
        <div className="reveal" style={{ maxWidth: 640 }}>
          <div className="mi-kick">Estratégias</div>
          <h2 className="mi-h2">As liberadas hoje, e as que estão na fila.</h2>
          <p className="mi-p">Cada estratégia passa pela mesma validação dos robôs da B3 antes de ser liberada. Os números abaixo estão em dólar. Clique pra ver a análise completa.</p>
        </div>

        <div className="mi-grid reveal">
          {loading && <div className="mi-vazio">carregando as estratégias</div>}
          {!loading && liberados.map(({ r, m }) => (
            <Link key={r.id} to={`/estrategias/${r.id}`} className="mi-robo">
              <div className="mi-robo-top">
                <div>
                  <div className="mi-robo-nome mono">{r.name}</div>
                  <div className="mi-robo-sub">{nomeAtivo(r.ativo)}{r.strategy_type ? ` · ${r.strategy_type.toLowerCase()}` : ''}{r.timeframe ? ` · ${r.timeframe}` : ''}</div>
                </div>
                <span className={'mi-tag ' + (m?.nReal ? 'real' : '')}>{m?.nReal ? 'conta real' : 'backtest'}</span>
              </div>
              {m ? (
                <>
                  <div className="mi-robo-big">
                    <div className={'v mono ' + (m.totalBruto >= 0 ? 'up' : 'dn')}>{fmtMoeda(m.totalBruto, 'USD', 0)}</div>
                    <div className="k">acumulado por lote mínimo · {m.nMeses} meses</div>
                  </div>
                  <div className="mi-robo-stats">
                    <div><div className="v mono">{fmtNum(m.profitFactor)}</div><div className="k">Fator de lucro</div></div>
                    <div><div className="v mono">{Math.round(m.winRate)}%</div><div className="k">Acerto</div></div>
                    <div><div className="v mono">{fmtMoeda(m.mediaMes, 'USD', 0)}</div><div className="k">Média / mês</div></div>
                    <div><div className="v mono">{mesAno(m.ini)}</div><div className="k">Desde</div></div>
                  </div>
                </>
              ) : <div className="mi-robo-sub">sem operações publicadas</div>}
              <div className="mi-go"><span className="a">Ver análise completa →</span></div>
            </Link>
          ))}
        </div>

        {!loading && validacao.length > 0 && (
          <div className="mi-fila reveal">
            <div className="mi-cbar"><span>Em validação</span><span>{validacao.length} estratégias</span></div>
            <div className="mi-chips">
              {validacao.map(r => (
                <Link key={r.id} to={`/estrategias/${r.id}`} className="mi-chip mono">{r.name}<span>{nomeAtivo(r.ativo)}</span></Link>
              ))}
            </div>
            <p className="mi-fila-p">Entram na lista de liberadas quando fecham os critérios do Método 6015: histórico, fator de lucro, drawdown e meses em conta real.</p>
          </div>
        )}
      </div></section>

      {/* PORTFÓLIOS DOO_PRIME (aparecem quando existirem no TQL) */}
      {portfolios.length > 0 && (
        <section className="mi-sec" id="portfolios"><div className="mi-wrap">
          <div className="reveal" style={{ maxWidth: 640 }}>
            <div className="mi-kick">Portfólios</div>
            <h2 className="mi-h2">Um portfólio pra cada tamanho de conta.</h2>
            <p className="mi-p">O capital recomendado está no nome. Resultado em dólar, publicado conforme entra na conta real.</p>
          </div>
          <div className="mi-ficha reveal">
            {portfolios.map(({ p, robos, nOps, total, capital, pct }) => (
              <div className="mi-fl" key={p.id}>
                <div className="mi-fl-nome"><span className="mono">{p.name.trim()}</span><span className="mi-fl-sub">{robos.map(r => r.name).join(' · ')}</span></div>
                <div className="mi-fl-cap mono">{capital ? fmtMoeda(capital, 'USD', 0) : '—'}<span>capital recomendado</span></div>
                <div className={'mi-fl-res mono ' + (total >= 0 ? 'up' : 'dn')}>{nOps ? fmtMoeda(total, 'USD') : 'em breve'}<span>{nOps ? `${pct != null ? (pct > 0 ? '+' : '') + pct.toFixed(1) + '% · ' : ''}${nOps} operações` : 'resultado em conta real'}</span></div>
              </div>
            ))}
          </div>
        </div></section>
      )}

      {/* VANTAGENS */}
      <section className="mi-sec" id="dooprime"><div className="mi-wrap"><div className="mi-row">
        <div className="mi-txt reveal">
          <div className="mi-kick">Por que a DooPrime</div>
          <h2 className="mi-h2">Uma conta feita pra robô.</h2>
          <p className="mi-p">Execução rápida, custo de rolagem baixo e VPS pra deixar o robô ligado o dia inteiro sem depender do seu computador.</p>
          <a className="mi-go" href={LINK_CONTA} target="_blank" rel="noopener noreferrer"><span className="a">Abrir conta na DooPrime →</span></a>
          <p className="mi-nota">As condições são da corretora e podem mudar sem aviso prévio.</p>
        </div>
        <div className="mi-lista reveal">
          {VANTAGENS.map(v => (
            <div className="mi-li" key={v.t}><div className="t">{v.t}</div><div className="d">{v.d}</div></div>
          ))}
        </div>
      </div></div></section>

      {/* CTA FINAL */}
      <section className="mi-final mi-wrap reveal">
        <h2>Abra a conta. Os robôs são por minha conta.</h2>
        <div className="mi-cta">
          <a className="mi-btn grad" href={LINK_CONTA} target="_blank" rel="noopener noreferrer">Abrir conta na DooPrime</a>
          <a className="mi-btn ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Já abri, quero os robôs</a>
        </div>
        <p className="mi-risco">Resultados passados não garantem retornos futuros. Forex, CFDs e derivativos envolvem risco, inclusive de perda do capital investido. Os valores desta página estão em dólar.</p>
      </section>
    </div>
  )
}

const CSS = `
.mi{ overflow-x:hidden;
  --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF; --up:#37E29B; --dn:#FF6B6B;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  background:var(--bg); color:var(--text); min-height:100vh;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.mi .mono{ font-family:'Geist Mono','SF Mono',monospace; font-variant-numeric:tabular-nums; }
.mi .mi-wrap{ max-width:1120px; margin:0 auto; padding:0 24px; }
.mi a{ color:inherit; text-decoration:none; }
.mi .up{ color:var(--up); } .mi .dn{ color:var(--dn); }

.mi-hero{ position:relative; text-align:center; padding:78px 0 64px; }
.mi-glow{ position:absolute; left:50%; top:60px; width:920px; height:560px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(56,198,255,.26), rgba(91,140,255,.14) 45%, transparent 72%); filter:blur(26px); z-index:0; animation:mibreathe 8s ease-in-out infinite; }
@keyframes mibreathe{ 0%,100%{opacity:.82} 50%{opacity:1; transform:translateX(-50%) scale(1.05)} }
.mi-hero-in{ position:relative; z-index:3; }
.mi-eyebrow{ font-family:'Geist Mono',monospace; font-size:12.5px; letter-spacing:.22em; text-transform:uppercase; color:var(--cyanA); margin-bottom:20px; }
.mi-h1{ font-weight:600; font-size:clamp(40px,7vw,84px); line-height:.98; letter-spacing:-.045em; margin:0 0 20px; }
.mi-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.mi-lede{ color:var(--muted); font-size:clamp(16px,2vw,20px); line-height:1.55; max-width:44ch; margin:0 auto 28px; }
.mi-cta{ display:flex; gap:13px; justify-content:center; flex-wrap:wrap; }
.mi-btn{ font-weight:600; font-size:16px; padding:14px 28px; border-radius:999px; cursor:pointer; transition:transform .12s; display:inline-block; }
.mi-btn.grad{ background:var(--grad); color:#04140f; box-shadow:0 12px 40px rgba(56,198,255,.26); }
.mi-btn.grad:hover{ transform:translateY(-2px); }
.mi-btn.ghost{ background:var(--glass); border:1px solid var(--line); color:var(--text); }
.mi-specs{ position:relative; z-index:6; display:grid; grid-template-columns:repeat(4,1fr); background:var(--glass);
  border:1px solid var(--line); border-radius:20px; backdrop-filter:blur(20px); max-width:980px; margin:52px auto 0; overflow:hidden; }
.mi-spec{ padding:22px 18px; border-right:1px solid var(--line); text-align:center; }
.mi-spec:last-child{ border-right:none; }
.mi-spec .v{ font-weight:600; font-size:27px; letter-spacing:-.02em; }
.mi-spec .k{ font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-top:7px; line-height:1.4; }

.mi-sec{ padding:110px 0; }
.mi-row{ display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
.mi-kick{ display:flex; font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:16px; }
.mi-h2{ font-weight:600; font-size:clamp(28px,4vw,46px); letter-spacing:-.035em; line-height:1.06; margin:0 0 16px; }
.mi-p{ color:var(--muted); font-size:17px; line-height:1.6; margin:0 0 26px; max-width:46ch; }
.mi-nota{ color:var(--muted); font-size:12.5px; margin:18px 0 0; }
.mi-go{ font-weight:600; font-size:16px; display:inline-flex; }
.mi-go .a{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.mi-card{ background:var(--glass); border:1px solid var(--line); border-radius:22px; backdrop-filter:blur(16px); padding:24px; box-shadow:0 30px 90px rgba(0,0,0,.4); }
.mi-cbar{ display:flex; justify-content:space-between; font-family:'Geist Mono',monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:16px; }
.mi-steps{ position:relative; padding-left:36px; }
.mi-steps:before{ content:''; position:absolute; left:12px; top:10px; bottom:14px; width:2px; border-radius:2px; background:linear-gradient(180deg,var(--tealA) 0%,var(--cyanA) 55%,rgba(91,140,255,.12) 100%); }
.mi-step{ position:relative; padding-bottom:22px; } .mi-step:last-child{ padding-bottom:0; }
.mi-step .n{ position:absolute; left:-36px; top:1px; width:26px; height:26px; border-radius:50%; background:var(--bg); border:1px solid var(--line); color:var(--muted); font-family:'Geist Mono',monospace; font-size:10px; display:grid; place-items:center; }
.mi-step .t{ font-size:15px; font-weight:600; } .mi-step .dsc{ margin-top:3px; font-size:13.5px; line-height:1.5; color:var(--muted); }

.mi-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:38px; }
.mi-vazio{ color:var(--muted); font-family:'Geist Mono',monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; padding:30px 0; }
.mi-robo{ display:flex; flex-direction:column; gap:18px; background:var(--glass); border:1px solid var(--line); border-radius:20px; padding:22px; transition:border-color .15s, transform .15s; }
.mi-robo:hover{ border-color:var(--cyanA); transform:translateY(-3px); }
.mi-robo-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
.mi-robo-nome{ font-weight:600; font-size:17px; letter-spacing:.02em; }
.mi-robo-sub{ color:var(--muted); font-size:12.5px; margin-top:3px; }
.mi-tag{ font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; padding:4px 9px; border-radius:999px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
.mi-tag.real{ color:var(--up); border-color:rgba(55,226,155,.4); }
.mi-robo-big .v{ font-size:32px; font-weight:600; letter-spacing:-.03em; line-height:1; }
.mi-robo-big .k{ font-family:'Geist Mono',monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-top:7px; }
.mi-robo-stats{ display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--line); padding-top:14px; }
.mi-robo-stats > div{ padding:0 8px; border-left:1px solid var(--line); } .mi-robo-stats > div:first-child{ padding-left:0; border-left:none; }
.mi-robo-stats .v{ font-size:15px; font-weight:600; } .mi-robo-stats .k{ font-size:10px; color:var(--muted); margin-top:3px; letter-spacing:.04em; }
.mi-fila{ margin-top:18px; background:var(--glass); border:1px solid var(--line); border-radius:20px; padding:22px; }
.mi-chips{ display:flex; flex-wrap:wrap; gap:8px; }
.mi-chip{ font-size:12.5px; padding:7px 12px; border-radius:999px; border:1px solid var(--line); color:var(--text); display:inline-flex; gap:8px; align-items:baseline; }
.mi-chip span{ color:var(--muted); font-family:'Geist',sans-serif; font-size:11.5px; }
.mi-chip:hover{ border-color:var(--cyanA); }
.mi-fila-p{ color:var(--muted); font-size:13px; line-height:1.55; margin:16px 0 0; max-width:70ch; }

.mi-ficha{ margin-top:34px; border-top:1px solid rgba(255,255,255,.14); }
.mi-fl{ display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:18px; padding:18px 0; border-bottom:1px solid var(--line); align-items:center; }
.mi-fl-nome{ display:flex; flex-direction:column; gap:4px; font-weight:600; font-size:16px; }
.mi-fl-sub{ font-weight:400; font-size:12px; color:var(--muted); }
.mi-fl-cap, .mi-fl-res{ font-size:20px; font-weight:600; display:flex; flex-direction:column; gap:3px; }
.mi-fl-cap span, .mi-fl-res span{ font-family:'Geist',sans-serif; font-size:11px; color:var(--muted); letter-spacing:.06em; text-transform:uppercase; font-weight:400; }
.mi-fl-res{ text-align:right; }

.mi-lista{ border-top:1px solid rgba(255,255,255,.14); }
.mi-li{ display:grid; grid-template-columns:200px 1fr; gap:16px; padding:14px 0; border-bottom:1px solid var(--line); }
.mi-li .t{ font-weight:600; font-size:15px; } .mi-li .d{ color:var(--muted); font-size:14px; line-height:1.5; }

.mi-final{ text-align:center; padding:110px 24px; }
.mi-final h2{ font-weight:600; font-size:clamp(30px,5vw,56px); letter-spacing:-.04em; margin:0 0 28px; }
.mi-risco{ color:var(--muted); font-size:12px; line-height:1.6; max-width:70ch; margin:34px auto 0; }

.mi .reveal{ opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease; }
.mi .reveal.in{ opacity:1; transform:none; }
.mi a:focus-visible{ outline:2px solid var(--cyanA); outline-offset:3px; }
@media (max-width:900px){ .mi-grid{ grid-template-columns:1fr; } }
@media (max-width:820px){
  .mi-row{ grid-template-columns:1fr; gap:28px; }
  .mi-specs{ grid-template-columns:1fr 1fr; } .mi-spec:nth-child(1),.mi-spec:nth-child(2){ border-bottom:1px solid var(--line); } .mi-spec:nth-child(2){ border-right:none; }
  .mi-sec{ padding:70px 0; }
  .mi-li{ grid-template-columns:1fr; gap:4px; }
  .mi-fl{ grid-template-columns:1fr; gap:10px; } .mi-fl-res{ text-align:left; }
}
@media (prefers-reduced-motion:reduce){ .mi *{ animation:none !important; } .mi .reveal{ opacity:1; transform:none; transition:none; } }
`
