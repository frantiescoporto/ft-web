import React, { useState } from 'react'

/* =========================================================================
   JORNADA DAY TRADE NO MODO AUTOMÁTICO — Landing page
   Padrão ft-web: componente funcional, export default, estilos inline + paleta s.
   -------------------------------------------------------------------------
   ⚙️  PREENCHA AS CONSTANTES ABAIXO:
   ========================================================================= */

// 1) Link do WhatsApp de aquecimento (formato wa.me com DDI+DDD+numero).
const WHATSAPP_URL =
  'https://wa.me/55DDNUMERO?text=Quero%20entrar%20na%20Jornada%20Day%20Trade%20no%20Modo%20Autom%C3%A1tico'

// 2) Sua foto PNG. Salve o arquivo em: public/img/frantiesco-trader.png
//    IMPORTANTE: nome tudo minúsculo e IGUALZINHO — a Vercel diferencia
//    maiúsculas de minúsculas. Se salvar como FRANTIESCO-TRADER.png, não aparece.
const FOTO_SRC = '/img/frantiesco-trader.png'

// 3) Print do seu gráfico de lucro. Salve em: public/img/grafico-lucro.png
const GRAFICO_LUCRO_SRC = '/img/grafico-lucro.png'

// 4) Logo (já existe em public/logos/).
const LOGO_SRC = '/logos/logo-frantiesco.png'

/* ========================================================================= */

const s = {
  accent:  '#00d4aa',
  dark:    '#080c12',
  surface: '#0f1520',
  card:    '#131b28',
  border:  'rgba(255,255,255,0.07)',
  text:    '#e8edf5',
  muted:   '#6b7a99',
  warning: '#f5a623',
  danger:  '#f06060',
  positive:'#34d47e',
}

const CSS = `
  .avel-root * { box-sizing: border-box; }
  .avel-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    text-decoration: none; cursor: pointer; border: none;
    transition: transform .15s ease, box-shadow .25s ease, filter .2s ease;
  }
  .avel-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }
  .avel-btn-primary:hover { box-shadow: 0 14px 34px rgba(0,212,170,.38); }
  .avel-card {
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }
  .avel-card:hover {
    transform: translateY(-4px);
    border-color: ${s.accent};
    box-shadow: 0 14px 38px rgba(0,0,0,.45);
  }
  @keyframes avelPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,212,170,.40); }
    50%     { box-shadow: 0 0 0 16px rgba(0,212,170,0); }
  }
  .avel-pulse { animation: avelPulse 2.6s infinite; }
  @media (prefers-reduced-motion: reduce) {
    .avel-pulse { animation: none; }
    .avel-btn:hover { transform: none; }
  }
  .avel-grid { display: grid; gap: 20px; }
  .avel-hero-grid { display: grid; grid-template-columns: 1.14fr .86fr; gap: 0; align-items: center; position: relative; }
  .avel-hero-text { position: relative; z-index: 2; }
  .avel-hero-foto { position: relative; z-index: 1; margin-left: -60px; }
  @media (max-width: 860px) {
    .avel-hero-grid { grid-template-columns: 1fr !important; text-align: center; gap: 24px; }
    .avel-hero-text { z-index: 2; }
    .avel-hero-foto { margin: 0 auto !important; max-width: 320px; }
  }
  @media (max-width: 760px) {
    .avel-hide-sm { display: none !important; }
    .avel-grid { grid-template-columns: 1fr !important; }
    .avel-h1 { font-size: 2.15rem !important; line-height: 1.12 !important; }
    .avel-sec { padding-top: 56px !important; padding-bottom: 56px !important; }
  }
`

// ---- estilos reutilizáveis (inline) ----
const container = { maxWidth: 1100, margin: '0 auto', padding: '0 22px' }
const section = { paddingTop: 92, paddingBottom: 92 }
const eyebrow = {
  display: 'inline-block',
  fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
  color: s.accent, marginBottom: 18,
}
const h2 = {
  fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.15,
  letterSpacing: '-0.02em', margin: 0, color: s.text,
}
const lead = {
  fontSize: 'clamp(1.02rem, 1.9vw, 1.22rem)', lineHeight: 1.65, color: s.muted,
  margin: '20px 0 0',
}
const accentText = { color: s.accent }

function BtnPrimary({ children, big }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="avel-btn avel-btn-primary avel-pulse"
      style={{
        background: s.accent,
        color: '#04211b',
        fontWeight: 800,
        fontSize: big ? 19 : 16,
        padding: big ? '18px 40px' : '14px 28px',
        borderRadius: 14,
        letterSpacing: '-0.01em',
        boxShadow: '0 10px 30px rgba(0,212,170,.28)',
      }}
    >
      <span style={{ fontSize: big ? 22 : 18 }}>💬</span>
      {children}
    </a>
  )
}

function StatCard({ number, label }) {
  return (
    <div
      className="avel-card"
      style={{
        background: s.card, border: `1px solid ${s.border}`, borderRadius: 16,
        padding: '30px 26px', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', fontWeight: 800, color: s.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {number}
      </div>
      <div style={{ marginTop: 12, color: s.muted, fontSize: 15, lineHeight: 1.45 }}>
        {label}
      </div>
    </div>
  )
}

// Mostra a imagem; se o arquivo não existir ainda, cai num placeholder.
function ImgSlot({ src, alt, label, imgStyle, minHeight }) {
  const [err, setErr] = useState(false)
  if (!src || err) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, minHeight: minHeight || 280, borderRadius: 16,
        border: `1px dashed ${s.border}`, background: s.card, color: s.muted,
      }}>
        <div style={{ fontSize: 30 }}>🖼️</div>
        <div style={{ fontSize: 13, textAlign: 'center', padding: '0 16px' }}>{label}</div>
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setErr(true)} style={imgStyle} />
}

export default function AvelPage() {
  return (
    <div className="avel-root" style={{ background: s.dark, color: s.text, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ===================== HEADER ===================== */}
      <header style={{ borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,12,18,0.82)', backdropFilter: 'blur(8px)' }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <img src={LOGO_SRC} alt="Frantiesco Trader" style={{ height: 30, width: 'auto' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="avel-btn"
            style={{ background: 'transparent', border: `1px solid ${s.accent}`, color: s.accent, fontWeight: 700, fontSize: 14, padding: '9px 18px', borderRadius: 10 }}
          >
            Entrar na jornada
          </a>
        </div>
      </header>

      {/* ===================== 1. HERÓI (com foto) ===================== */}
      <section className="avel-sec" style={{ ...section, position: 'relative', paddingTop: 84, paddingBottom: 84 }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 900, height: 620, background: 'radial-gradient(closest-side, rgba(0,212,170,0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ ...container, position: 'relative' }}>
          <div className="avel-hero-grid">
            {/* texto */}
            <div className="avel-hero-text">
              <span style={{ ...eyebrow, border: `1px solid ${s.border}`, borderRadius: 999, padding: '7px 16px', background: s.surface }}>
                ● Jornada ao vivo · 30 dias
              </span>
              <h1 className="avel-h1" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', margin: '10px 0 0', textShadow: '0 2px 26px rgba(8,12,18,0.7)' }}>
                Você não vai receber sinal.<br />
                Você vai <span style={accentText}>operar um sistema</span> ao vivo, junto comigo.
              </h1>
              <p style={{ ...lead, color: s.text }}>
                30 dias operando de verdade, <strong style={{ color: s.text }}>das 9h às 11h</strong>, com a minha conta na tela
                e o robô <strong style={{ color: s.accent }}>Scalper Haaland</strong> rodando em tempo real.
                Sem sala de sinal, sem palpite. Vamos usar um <strong style={{ color: s.text }}>ecossistema completo</strong> ao nosso favor.
              </p>
              <div style={{ marginTop: 30 }}>
                <BtnPrimary big>Entrar no grupo do WhatsApp</BtnPrimary>
              </div>
              <div style={{ marginTop: 14, color: s.muted, fontSize: 14 }}>
                Vagas limitadas para a jornada.
              </div>
            </div>

            {/* foto */}
            <div className="avel-hero-foto">
              <ImgSlot
                src={FOTO_SRC}
                alt="Frantiesco Trader"
                minHeight={360}
                imgStyle={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' }}
                label="Sua foto PNG aqui (public/img/frantiesco-trader.png)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 2. POR QUE ISSO FUNCIONA DE VERDADE ===================== */}
      <section className="avel-sec" style={{ ...section, background: s.surface, borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={{ ...container, maxWidth: 860 }}>
          <span style={eyebrow}>Por que isso funciona de verdade</span>
          <h2 style={h2}>Isso não é uma sala de sinais.</h2>
          <p style={lead}>
            Sala de sinal te entrega um palpite e some quando dá errado. A responsabilidade fica toda no seu dedo,
            na sua leitura, no seu emocional. Aqui é outra coisa: um <span style={accentText}>ecossistema automatizado</span>,
            estratégia, robô, gestão e execução funcionando como uma máquina, na sua frente, todo dia.
            Você não segue um palpite. <strong style={{ color: s.text }}>Você acompanha um sistema operar automaticamente,
            sem influência do seu medo e da sua emoção.</strong>
          </p>
        </div>
      </section>

      {/* ===================== 3. O TRADER QUEBRA PORQUE NÃO TEM DADOS ===================== */}
      <section className="avel-sec" style={section}>
        <div style={{ ...container, maxWidth: 900 }}>
          <span style={eyebrow}>A verdade</span>
          <h2 style={h2}>O trader quebra porque não tem dados.</h2>
          <p style={lead}>
            O trader que não tem um sistema baseado em dados sente medo facilmente, não sabe o que esperar,
            não tem noção do que pode ganhar ou perder, desiste nas horas erradas e se empolga além da conta
            por conta de pequenos avanços. O trader que quebra, quebra porque planejou mal. O problema não foi
            o gráfico, foi muito antes disso.
          </p>

          <div className="avel-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 34 }}>
            {[
              'Não tem noção do drawdown da sua estratégia.',
              'Espera obter lucros acima do que o mercado pode dar.',
              'Não tem regras claras para cada evento.',
            ].map((txt, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.danger}`, borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: s.text }}>{txt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 4. O QUE RESOLVE ===================== */}
      <section className="avel-sec" style={{ ...section, background: s.surface, borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={{ ...container, maxWidth: 900 }}>
          <span style={eyebrow}>O que resolve</span>
          <h2 style={h2}>No modo automático, o medo não opera por você.</h2>
          <p style={lead}>
            O robô não tem medo. Não tem ganância. Não tira o stop. Não dobra pra recuperar. Ele executa o
            plano, sempre igual. E porque é <span style={accentText}>dado</span>, você sabe exatamente quanto pode
            ganhar e quanto pode perder antes de apertar o play. Sistema vale mais que coragem.
          </p>

          <div className="avel-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 36 }}>
            {[
              { t: 'Sem medo', d: 'Executa na hora certa, sem travar no clique.' },
              { t: 'Sem ganância', d: 'Respeita o alvo e o stop. Não improvisa pra "recuperar".' },
              { t: 'Com dado', d: 'Você conhece o risco e o retorno antes de operar.' },
            ].map((c, i) => (
              <div key={i} className="avel-card" style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: '26px 24px' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.accent, marginBottom: 8 }}>{c.t}</div>
                <p style={{ margin: 0, color: s.muted, fontSize: 15, lineHeight: 1.55 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 5. POR QUE COMIGO + PRINT DE LUCRO ===================== */}
      <section className="avel-sec" style={section}>
        <div style={{ ...container, textAlign: 'center', maxWidth: 960 }}>
          <span style={eyebrow}>Por que operar isso comigo</span>
          <h2 style={{ ...h2, marginBottom: 8 }}>Não é teoria. É a minha conta rodando.</h2>

          {/* PRINT DO GRÁFICO DE LUCRO */}
          <div style={{ marginTop: 30 }}>
            <ImgSlot
              src={GRAFICO_LUCRO_SRC}
              alt="Gráfico de lucro"
              minHeight={340}
              imgStyle={{ width: '100%', height: 'auto', display: 'block', borderRadius: 18, border: `1px solid ${s.border}` }}
              label="Print do seu gráfico de lucro aqui (public/img/grafico-lucro.png)"
            />
          </div>

          {/* números de autoridade */}
          <div className="avel-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 36 }}>
            <StatCard number="+19.000%" label="do CDI em 2025 nas minhas estratégias" />
            <StatCard number="+500 mil" label="contratos operados em um único mês" />
            <StatCard number="R$ 20k" label="salário que larguei pra viver de trading" />
          </div>
        </div>
      </section>

      {/* ===================== 6. A OFERTA (jornada + bônus + Haaland em destaque) ===================== */}
      <section className="avel-sec" style={{ ...section, background: s.surface, borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={{ ...container, maxWidth: 860 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={eyebrow}>A oferta</span>
            <h2 style={h2}>Jornada Day Trade no Modo Automático</h2>
            <p style={{ ...lead, maxWidth: 640, margin: '18px auto 0' }}>
              30 dias operando ao vivo comigo, das 9h às 11h, com a minha conta na tela. E pra você operar de
              verdade no automático, um arsenal completo.
            </p>
          </div>

          {/* DESTAQUE: ROBÔ HAALAND */}
          <div
            className="avel-card"
            style={{
              marginTop: 34, background: 'linear-gradient(180deg, rgba(0,212,170,0.10), rgba(0,212,170,0.02))',
              border: `1.5px solid ${s.accent}`, borderRadius: 20, padding: 'clamp(26px, 4vw, 38px)',
              boxShadow: '0 0 60px rgba(0,212,170,0.14)', textAlign: 'center',
            }}
          >
            <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#04211b', background: s.accent, padding: '6px 14px', borderRadius: 999 }}>
              ⭐ Destaque da jornada
            </span>
            <div style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 8px' }}>
              🤖 Robô Scalper Haaland
            </div>
            <p style={{ margin: 0, color: s.text, fontSize: 17, lineHeight: 1.6 }}>
              Exclusivo da jornada. Fez <strong style={{ color: s.accent }}>+100% em menos de 2 meses.</strong>
            </p>
          </div>

          {/* BÔNUS QUE ENTRAM JUNTO */}
          <div style={{ marginTop: 30 }}>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: s.muted, marginBottom: 18 }}>
              E ainda entra junto
            </div>
            <div className="avel-card" style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 18, padding: 'clamp(22px, 3.5vw, 32px)' }}>
              {[
                ['Conta na AVEL com corretagem grátis', 'Sua conta na corretora, sem custo de corretagem.'],
                ['Profit Ultra liberado', 'A plataforma completa pra operar e automatizar.'],
                ['Módulo de automação com RLP', 'Automação com RLP pra rodar suas estratégias.'],
                ['Pack de 20 automações prontas', '20 automações pra você usar desde o primeiro dia.'],
                ['30 dias de Trade Quant Lab no plano DEV', 'O plano mais caro da plataforma, liberado por 30 dias.'],
                ['Sala ao vivo de desenvolvimento', 'Testo e valido as suas automações e algoritmos, desenvolvo junto com você e mostro na prática como analiso uma estratégia.'],
              ].map(([t, d], i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: i < arr.length - 1 ? 16 : 0, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${s.border}` : 'none' }}>
                  <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,212,170,0.14)', color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16.5, color: s.text }}>{t}</div>
                    <div style={{ color: s.muted, fontSize: 14.5, marginTop: 3, lineHeight: 1.5 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: s.muted, fontSize: 13, marginTop: 14, textAlign: 'center' }}>
              * Bônus liberados operando um volume mínimo de contratos.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <BtnPrimary big>Quero entrar na jornada</BtnPrimary>
          </div>
        </div>
      </section>

      {/* ===================== 7. A MECÂNICA (prova, não preço) ===================== */}
      <section className="avel-sec" style={section}>
        <div style={{ ...container, maxWidth: 900 }}>
          <span style={eyebrow}>Como funciona de verdade</span>
          <h2 style={h2}>Não custa dinheiro. Custa sair da arquibancada.</h2>
          <p style={lead}>
            Você não paga pra entrar. O "preço" é outro: parar de assistir e começar a operar. Abrir a sua
            conta na AVEL e rodar o volume mínimo de contratos junto comigo, ao vivo.
          </p>
          <p style={{ ...lead, marginTop: 16 }}>
            Vou ser direto: é <strong style={{ color: s.warning }}>dinheiro de verdade</strong> e é
            <strong style={{ color: s.warning }}> risco de verdade</strong>. Se você já se queimou no mercado,
            sabe que promessa fácil é mentira. Aqui não tem isso. Tem sistema, tem transparência e tem
            execução na sua frente.
          </p>

          <div className="avel-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 36 }}>
            {[
              ['1', 'Entre no WhatsApp', 'Você recebe os detalhes e o passo a passo da jornada.'],
              ['2', 'Abra sua conta na AVEL', 'Conta com corretagem grátis, pronta pra operar e automatizar.'],
              ['3', 'Opere ao vivo', 'Das 9h às 11h, com o sistema rodando junto com o meu.'],
            ].map(([n, t, d], i) => (
              <div key={i} className="avel-card" style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: '26px 24px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,212,170,0.12)', color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, marginBottom: 14 }}>{n}</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: s.text }}>{t}</div>
                <p style={{ margin: '6px 0 0', color: s.muted, fontSize: 15, lineHeight: 1.55 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 8. CTA FINAL ===================== */}
      <section className="avel-sec" style={{ ...section, background: s.surface, borderTop: `1px solid ${s.border}`, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(closest-side, rgba(0,212,170,0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ ...container, position: 'relative', textAlign: 'center', maxWidth: 760 }}>
          <h2 style={{ ...h2, fontSize: 'clamp(2rem, 4.6vw, 3rem)' }}>
            A arquibancada não paga suas contas.
          </h2>
          <p style={{ ...lead, maxWidth: 560, margin: '20px auto 0', color: s.text }}>
            30 dias, ao vivo, com o sistema operando na sua frente. Chega de assistir o mercado passar.
          </p>
          <div style={{ marginTop: 34 }}>
            <BtnPrimary big>Entrar no grupo do WhatsApp</BtnPrimary>
          </div>
        </div>
      </section>

      {/* ===================== 9. RODAPÉ / DISCLAIMER ===================== */}
      <footer style={{ background: s.dark, borderTop: `1px solid ${s.border}`, padding: '40px 0' }}>
        <div style={{ ...container, textAlign: 'center' }}>
          <img src={LOGO_SRC} alt="Frantiesco Trader" style={{ height: 26, width: 'auto', opacity: 0.85, marginBottom: 18 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <p style={{ color: s.muted, fontSize: 13, lineHeight: 1.7, maxWidth: 760, margin: '0 auto' }}>
            <strong style={{ color: s.text }}>Aviso de risco.</strong> A operação com derivativos, contratos futuros e
            demais instrumentos do mercado financeiro envolve <strong>risco de perda</strong>, inclusive de todo o
            capital investido. Rentabilidade passada não representa garantia de rentabilidade futura. Nenhum
            conteúdo desta página constitui recomendação, oferta ou solicitação de investimento. As decisões de
            investimento são de responsabilidade exclusiva do investidor.
          </p>
          <p style={{ color: s.muted, fontSize: 12, marginTop: 20, opacity: 0.7 }}>
            © {new Date().getFullYear()} Frantiesco Trader
          </p>
        </div>
      </footer>
    </div>
  )
}
