import React from 'react'
import { useNavigate } from 'react-router-dom'

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99', warning: '#f5a623',
}

const WA = 'https://wa.me/5553999010262'

export default function ComoAdquirirPage() {
  const navigate = useNavigate()

  const steps = [
    {
      n: '01', icon: '🤝', title: 'Entre em contato',
      desc: 'Fale comigo pelo WhatsApp. Vamos entender seu perfil de trader, capital disponível e objetivos antes de qualquer coisa.',
    },
    {
      n: '02', icon: '📊', title: 'Análise do seu perfil',
      desc: 'Avaliamos juntos qual portfólio de automações faz mais sentido para você — WIN, WDO, BIT ou misto.',
    },
    {
      n: '03', icon: '🧪', title: 'Período de teste',
      desc: 'Você acessa os robôs para teste pagando apenas a corretagem operacional. Sem custo de licença nessa fase.',
    },
    {
      n: '04', icon: '📈', title: 'Avaliação dos resultados',
      desc: 'Acompanhamos juntos os resultados do período de teste usando a plataforma Trade Quant Lab.',
    },
    {
      n: '05', icon: '🎓', title: 'Migração para a Mentoria',
      desc: 'Com os resultados em mãos, você decide se quer entrar na mentoria SmartLab para aprender a operar com total autonomia.',
    },
  ]

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none',
          color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Voltar
        </button>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: s.accent, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Como funciona
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Acesse os robôs.<br />
            <span style={{ color: s.accent }}>Sem risco de entrada.</span>
          </h1>
          <p style={{ color: s.muted, fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            A ideia é simples: você testa antes de decidir. Paga apenas a corretagem
            operacional no período de teste — e só migra para a mentoria se fizer sentido para você.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`,
              borderRadius: 14, padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'flex-start',
              borderLeft: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.08)',
                lineHeight: 1, flexShrink: 0, minWidth: 40 }}>{step.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{step.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{step.title}</span>
                </div>
                <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* O que está incluso */}
        <div style={{ background: s.surface, border: `1px solid ${s.border}`,
          borderRadius: 16, padding: '32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>O que você recebe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '🤖', t: 'Robôs validados pelo Método 6015', d: 'Cada estratégia passa por backtest, out-of-sample e paper trading.' },
              { icon: '📊', t: 'Plataforma Trade Quant Lab', d: 'Acesso à plataforma de análise e acompanhamento dos portfólios.' },
              { icon: '📱', t: 'Suporte direto no WhatsApp', d: 'Tire dúvidas sobre configuração, resultados e operação.' },
              { icon: '📅', t: 'Relatórios mensais', d: 'Acompanhe os resultados dos portfólios mês a mês com transparência total.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.t}</div>
                  <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.5 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '36px',
          textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Pronto para começar?
          </h2>
          <p style={{ color: s.muted, fontSize: 14, marginBottom: 24 }}>
            Me chame no WhatsApp e vamos ver qual portfólio faz sentido para você.
          </p>
          <a href={`${WA}?text=${encodeURIComponent('Olá! Quero saber mais sobre os robôs de trading do Método 6015.')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: s.accent, color: '#000', padding: '14px 32px',
              borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>
            💬 Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
