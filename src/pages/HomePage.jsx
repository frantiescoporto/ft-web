import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { supabase } from '../lib/supabaseClient'

const s = {
  accent: '#00d4aa',
  dark: '#080c12',
  surface: '#0f1520',
  card: '#131b28',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5',
  muted: '#6b7a99',
  hint: '#2a3550',
  warning: '#f5a623',
}

export default function HomePage() {
  const navigate = useNavigate()
  const { robots, mentPortfolios, loading } = useData()

  // ── Avaliações (prova social) — puxa as aprovadas ao vivo do Supabase ──
  const [avalStats, setAvalStats] = useState(null)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('avaliacoes')
          .select('suporte, aulas, estrategias, didatica, compraria')
        if (error || !data || data.length === 0) { setAvalStats({ n: 0 }); return }
        const media = (key) => {
          const vals = data.map(r => r[key]).filter(v => v != null && v > 0)
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        }
        const eixos = ['suporte', 'aulas', 'estrategias', 'didatica'].map(media).filter(v => v > 0)
        const geral = eixos.length ? eixos.reduce((a, b) => a + b, 0) / eixos.length : 0
        const comprariaPct = Math.round((data.filter(r => r.compraria).length / data.length) * 100)
        setAvalStats({ n: data.length, geral, comprariaPct })
      } catch {
        setAvalStats({ n: 0 })
      }
    })()
  }, [])

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 60px', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          border: `1px solid ${s.accent}44`, borderRadius: 99,
          padding: '5px 16px', fontSize: 12, color: s.accent,
          fontWeight: 600, letterSpacing: '.08em', marginBottom: 28,
          background: `${s.accent}0d` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: s.accent, display: 'inline-block',
            boxShadow: `0 0 8px ${s.accent}` }} />
          Frantiesco Trader · Método 6015
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900,
          lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Trading algorítmico<br />
          <span style={{ color: s.accent }}>com transparência total.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: s.muted,
          lineHeight: 1.7, maxWidth: 560, margin: '0 auto 48px' }}>
          Veja os portfólios recomendados, resultados reais das estratégias
          e aprenda a construir seu próprio portfólio de automações.
        </p>

        {/* ── 2 Botões Principais ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 16, maxWidth: 680, margin: '0 auto 48px' }}>

          {/* Portfólios Recomendados */}
          <button onClick={() => navigate('/estrategias')}
            style={{ background: `linear-gradient(135deg, ${s.accent}22, ${s.accent}08)`,
              border: `1px solid ${s.accent}55`, borderRadius: 16,
              padding: '32px 24px', cursor: 'pointer', textAlign: 'left',
              transition: 'all .2s', color: s.text }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.accent}55`; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: s.accent }}>
              Estratégias
            </div>
            <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>
              Veja as estratégias algorítmicas com análise completa — métricas, gráficos, validação e anos de dados.
            </div>
            {!loading && (
              <div style={{ marginTop: 16, fontSize: 12, color: s.accent, fontWeight: 700 }}>
                {robots.filter(r => (r.platform||'profit') !== 'mt5').length} estratégias →
              </div>
            )}
          </button>

          {/* Resultados */}
          <button onClick={() => navigate('/resultados')}
            style={{ background: `linear-gradient(135deg, rgba(79,142,247,0.13), rgba(79,142,247,0.04))`,
              border: '1px solid rgba(79,142,247,0.35)', borderRadius: 16,
              padding: '32px 24px', cursor: 'pointer', textAlign: 'left',
              transition: 'all .2s', color: s.text }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f8ef7'; e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,142,247,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#4f8ef7' }}>
              Resultados
            </div>
            <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>
              Veja os resultados dos portfólios recomendados em conta real — sem backtest, apenas resultados reais.
            </div>
            {!loading && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#4f8ef7', fontWeight: 700 }}>
                {robots.length} estratégias →
              </div>
            )}
          </button>
        </div>

        {/* ── 3 Opções Menores ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, maxWidth: 680, margin: '0 auto' }}>

          {/* Como adquirir */}
          <button onClick={() => navigate('/como-adquirir')}
            style={{ background: s.surface, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
              textAlign: 'center', transition: 'all .2s', color: s.text }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.background = `${s.accent}08` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = s.surface }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Como adquirir</div>
            <div style={{ fontSize: 11, color: s.muted }}>os robôs</div>
          </button>

          {/* Meu Histórico */}
          <button onClick={() => navigate('/historico')}
            style={{ background: s.surface, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
              textAlign: 'center', transition: 'all .2s', color: s.text }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9b7cf4'; e.currentTarget.style.background = 'rgba(155,124,244,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = s.surface }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Meu Histórico</div>
            <div style={{ fontSize: 11, color: s.muted }}>trajetória ano a ano</div>
          </button>

          {/* SmartLab */}
          <a href="https://use.invest.academy/ed-capt-lp-smartlab"
            target="_blank" rel="noopener noreferrer"
            style={{ background: s.surface, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
              textAlign: 'center', transition: 'all .2s', color: s.text,
              textDecoration: 'none', display: 'block' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.warning; e.currentTarget.style.background = `${s.warning}08` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = s.surface }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎓</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: s.warning }}>
              Mentoria SmartLab
            </div>
            <div style={{ fontSize: 11, color: s.muted }}>Nelogica · 3 meses</div>
          </a>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section style={{ background: s.surface, borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: s.accent, fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Quem sou eu
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800,
              lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Trader algorítmico há mais de uma década.
            </h2>
            <p style={{ color: s.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
              Desenvolvedor de estratégias quantitativas para o mercado brasileiro.
              Criador do Método 6015 e parceiro Nelogica/XP — ensinando traders a
              operar com ciência, não com intuição.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Parceiro XP', 'Parceiro Nelogica', 'Método 6015', 'Trading 100% automatizado'].map((tag, i) => (
                <span key={i} style={{ fontSize: 12, padding: '4px 12px',
                  background: `${s.accent}18`, border: `1px solid ${s.accent}44`,
                  borderRadius: 99, color: s.accent, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { v: '10+', l: 'anos de mercado' },
              { v: robots.length || '108', l: 'estratégias desenvolvidas' },
              { v: mentPortfolios.length || '14', l: 'portfólios curados' },
              { v: '3 meses', l: 'SmartLab com Nelogica' },
            ].map((st, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`,
                borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.accent, marginBottom: 4 }}>{st.v}</div>
                <div style={{ fontSize: 11, color: s.muted }}>{st.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENTORIA MÉTODO 6015 DESTAQUE ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px' }}>
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '40px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: s.accent, fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              🔥 Inscrições abertas · vagas limitadas
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: 12 }}>
              Método 6015 — o método que eu opero, em conta real
            </h2>
            <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 560, marginBottom: 20 }}>
              Não é um curso comum: é acompanhamento completo com os mesmos robôs e o mesmo
              portfólio que eu opero, com resultado publicado mês a mês — incluindo os meses
              negativos. Sem sala de sinais, sem promessa milagrosa.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['Conta real, mês a mês', '~40 robôs disponíveis', '3–5 min por dia', 'Sem sala de sinais'].map((f, i) => (
                <span key={i} style={{ fontSize: 12, padding: '4px 12px',
                  background: `${s.accent}18`, border: `1px solid ${s.accent}33`,
                  borderRadius: 99, color: s.accent }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <button onClick={() => navigate('/mentoria_metodo6015')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: s.accent, color: '#04140f', border: 'none',
                padding: '14px 28px', borderRadius: 10, fontWeight: 800, fontSize: 15,
                cursor: 'pointer', transition: 'opacity .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Quero minha vaga →
            </button>
            <div style={{ fontSize: 11, color: s.muted, marginTop: 10 }}>
              Vagas limitadas · 7 dias de garantia.
            </div>
          </div>
        </div>
      </section>

      {/* ── AVALIAÇÕES DOS ALUNOS (prova social) ── */}
      {avalStats && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 60px' }}>
          <div
            onClick={() => navigate('/avaliacoes')}
            role="button"
            style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
              border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '32px 40px',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: 24, cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.accent}44`; e.currentTarget.style.transform = 'translateY(0)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
              {avalStats.n > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 900, color: s.accent, lineHeight: 1 }}>
                    {avalStats.geral.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 4, letterSpacing: 1 }}>
                    <span style={{ color: '#FFC53D' }}>{'★★★★★'.slice(0, Math.round(avalStats.geral))}</span>
                    <span style={{ color: 'rgba(255,255,255,0.18)' }}>{'★★★★★'.slice(Math.round(avalStats.geral))}</span>
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                  O que os alunos dizem
                </div>
                <div style={{ color: s.muted, fontSize: 14 }}>
                  {avalStats.n > 0
                    ? `${avalStats.n} avaliações${avalStats.comprariaPct ? ` · ${avalStats.comprariaPct}% comprariam novamente` : ''}`
                    : 'Veja as avaliações de quem já fez a mentoria'}
                </div>
              </div>
            </div>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: s.accent, color: '#04140f', padding: '14px 26px',
              borderRadius: 10, fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>
              Ver avaliações →
            </span>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: s.surface, borderTop: `1px solid ${s.border}`,
        padding: '28px 32px', textAlign: 'center', color: s.muted, fontSize: 13 }}>
        <div>Frantiesco Trader · Método 6015</div>
        <div style={{ marginTop: 6, fontSize: 11 }}>
          Resultados passados não garantem resultados futuros. Trading envolve risco.
        </div>
      </footer>
    </div>
  )
}
