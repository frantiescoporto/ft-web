import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

/* ------------------------------------------------------------------ */
/*  Configuração (edite os textos/itens livremente aqui)              */
/* ------------------------------------------------------------------ */
const EIXOS = [
  { key: 'suporte',     label: 'Suporte do mentor' },
  { key: 'aulas',       label: 'Qualidade das aulas (ao vivo e gravadas)' },
  { key: 'estrategias', label: 'Qualidade das estratégias disponibilizadas' },
  { key: 'didatica',    label: 'Didática / clareza nas explicações', opcional: true },
]

const FATORES = [
  'Consistência nos resultados',
  'Disciplina operacional',
  'Gestão de risco',
  'Controle emocional / psicológico',
  'Retorno financeiro',
  'Entendimento de robôs e automação',
  'Confiança para operar',
  'Organização e rotina',
]

/* paleta — usa as variáveis do seu global.css com fallback */
const C = {
  bg:     'var(--bg, #0b0e11)',
  card:   'var(--card, #14181d)',
  border: 'var(--border, rgba(255,255,255,0.08))',
  text:   'var(--text, #e9edf1)',
  muted:  'var(--muted, #8b95a1)',
  accent: 'var(--accent, #16c784)',
  star:   '#FFC53D',
}

/* ------------------------------------------------------------------ */
/*  Componente de estrelas                                             */
/* ------------------------------------------------------------------ */
function Stars({ value = 0, onChange, size = 30, readOnly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n
        return (
          <span
            key={n}
            role={readOnly ? undefined : 'button'}
            onClick={readOnly ? undefined : () => onChange(n)}
            onMouseEnter={readOnly ? undefined : () => setHover(n)}
            onMouseLeave={readOnly ? undefined : () => setHover(0)}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              fontSize: size, lineHeight: 1,
              color: active ? C.star : 'rgba(255,255,255,0.18)',
              transition: 'color .12s', userSelect: 'none',
            }}
          >★</span>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */
export default function AvaliacaoPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    nome: '', suporte: 0, aulas: 0, estrategias: 0, didatica: 0,
    fatores: [], comentario: '', compraria: null, motivo_nao: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [erro, setErro] = useState('')

  /* carrega as avaliações aprovadas */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('nome, suporte, aulas, estrategias, didatica, fatores, comentario, compraria, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) setReviews(data)
      setLoading(false)
    })()
  }, [])

  /* ---- médias e agregações ---- */
  const stats = useMemo(() => {
    const n = reviews.length
    const media = (key) => {
      const vals = reviews.map((r) => r[key]).filter((v) => v != null && v > 0)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }
    const porEixo = EIXOS.map((e) => ({ ...e, media: media(e.key) })).filter((e) => e.media > 0)
    const geral = porEixo.length ? porEixo.reduce((a, b) => a + b.media, 0) / porEixo.length : 0
    const comprariaPct = n ? Math.round((reviews.filter((r) => r.compraria).length / n) * 100) : 0
    const fatores = FATORES
      .map((f) => ({ nome: f, qtd: reviews.filter((r) => (r.fatores || []).includes(f)).length }))
      .filter((f) => f.qtd > 0)
      .sort((a, b) => b.qtd - a.qtd)
    const comentarios = reviews.filter((r) => r.comentario && r.comentario.trim())
    return { n, geral, porEixo, comprariaPct, fatores, comentarios }
  }, [reviews])

  /* ---- envio ---- */
  const toggleFator = (f) =>
    setForm((s) => ({
      ...s,
      fatores: s.fatores.includes(f) ? s.fatores.filter((x) => x !== f) : [...s.fatores, f],
    }))

  const enviar = async () => {
    setErro('')
    if (!form.suporte || !form.aulas || !form.estrategias) {
      setErro('Por favor, dê uma nota (estrelas) para os três primeiros itens.')
      return
    }
    if (form.compraria === null) {
      setErro('Responda se compraria a mentoria novamente.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('avaliacoes').insert({
      nome: form.nome.trim() || null,
      suporte: form.suporte,
      aulas: form.aulas,
      estrategias: form.estrategias,
      didatica: form.didatica || null,
      fatores: form.fatores,
      comentario: form.comentario.trim() || null,
      compraria: form.compraria,
      motivo_nao: form.compraria === false ? (form.motivo_nao.trim() || null) : null,
      aprovado: false,
    })
    setSending(false)
    if (error) { setErro('Não foi possível enviar agora. Tente novamente em instantes.'); return }
    setSent(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ---- estilos auxiliares ---- */
  const wrap   = { background: C.bg, minHeight: '100vh', color: C.text, padding: '24px 16px' }
  const inner  = { maxWidth: 880, margin: '0 auto' }
  const card   = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }
  const label  = { fontWeight: 700, fontSize: 15, marginBottom: 8 }

  return (
    <div style={wrap}>
      <div style={inner}>
        <Link to="/" style={{ color: C.muted, textDecoration: 'none', fontSize: 14 }}>← Início</Link>

        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '14px 0 4px' }}>
          Avaliações da Mentoria
        </h1>
        <p style={{ color: C.muted, marginTop: 0 }}>
          O que os alunos do Método 6015 dizem — e o espaço para você deixar a sua.
        </p>

        {/* -------------------- RESUMO / MÉDIAS -------------------- */}
        {loading ? (
          <p style={{ color: C.muted }}>Carregando avaliações…</p>
        ) : stats.n === 0 ? (
          <div style={{ ...card, textAlign: 'center', margin: '18px 0' }}>
            <p style={{ margin: 0, color: C.muted }}>
              Ainda não há avaliações publicadas. Seja o primeiro a avaliar 👇
            </p>
          </div>
        ) : (
          <>
            {/* nota geral + compraria */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '18px 0' }}>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: C.star, lineHeight: 1 }}>
                  {stats.geral.toFixed(1)}
                </div>
                <Stars value={Math.round(stats.geral)} readOnly size={22} />
                <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
                  Nota geral · {stats.n} avaliaç{stats.n === 1 ? 'ão' : 'ões'}
                </div>
              </div>
              <div style={{ ...card, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: C.accent, lineHeight: 1 }}>
                  {stats.comprariaPct}%
                </div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>
                  comprariam a mentoria novamente
                </div>
              </div>
            </div>

            {/* médias por eixo */}
            <div style={{ ...card, marginBottom: 14 }}>
              {stats.porEixo.map((e) => (
                <div key={e.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14 }}>{e.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <Stars value={Math.round(e.media)} readOnly size={18} />
                    <strong style={{ color: C.star, minWidth: 28, textAlign: 'right' }}>{e.media.toFixed(1)}</strong>
                  </span>
                </div>
              ))}
            </div>

            {/* fatores mais citados */}
            {stats.fatores.length > 0 && (
              <div style={{ ...card, marginBottom: 14 }}>
                <div style={{ ...label, marginBottom: 14 }}>O que mais ajudou os alunos</div>
                {stats.fatores.map((f) => {
                  const pct = Math.round((f.qtd / stats.n) * 100)
                  return (
                    <div key={f.nome} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{f.nome}</span><span style={{ color: C.muted }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: C.accent, borderRadius: 6 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* comentários */}
            {stats.comentarios.length > 0 && (
              <div style={{ marginBottom: 26 }}>
                <div style={{ ...label, marginBottom: 12 }}>Depoimentos</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {stats.comentarios.map((r, i) => (
                    <div key={i} style={card}>
                      <Stars
                        value={Math.round((r.suporte + r.aulas + r.estrategias) / 3)}
                        readOnly size={16}
                      />
                      <p style={{ margin: '10px 0 6px', fontSize: 15, lineHeight: 1.5 }}>"{r.comentario}"</p>
                      <div style={{ color: C.muted, fontSize: 13 }}>— {r.nome || 'Aluno(a) Método 6015'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* -------------------- FORMULÁRIO -------------------- */}
        <div style={{ ...card, marginTop: 10 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <h2 style={{ margin: '8px 0' }}>Avaliação enviada!</h2>
              <p style={{ color: C.muted, margin: 0 }}>
                Obrigado pelo feedback. Ela será publicada após uma rápida revisão.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ marginTop: 0, fontSize: 22 }}>Deixe sua avaliação</h2>

              {EIXOS.map((e) => (
                <div key={e.key} style={{ marginBottom: 16 }}>
                  <div style={label}>
                    {e.label}{' '}
                    {e.opcional && <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>(opcional)</span>}
                  </div>
                  <Stars value={form[e.key]} onChange={(v) => setForm((s) => ({ ...s, [e.key]: v }))} />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <div style={label}>O que a mentoria te ajudou a desenvolver?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FATORES.map((f) => {
                    const on = form.fatores.includes(f)
                    return (
                      <button key={f} type="button" onClick={() => toggleFator(f)}
                        style={{
                          padding: '8px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                          border: `1px solid ${on ? C.accent : C.border}`,
                          background: on ? 'rgba(22,199,132,0.14)' : 'transparent',
                          color: on ? C.accent : C.text, fontWeight: on ? 700 : 500,
                        }}>
                        {on ? '✓ ' : ''}{f}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={label}>Conte em poucas palavras o que mudou pra você <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>(opcional)</span></div>
                <textarea
                  value={form.comentario}
                  onChange={(e) => setForm((s) => ({ ...s, comentario: e.target.value }))}
                  rows={4} maxLength={600}
                  placeholder="Seu depoimento aparece na página de avaliações."
                  style={{ width: '100%', boxSizing: 'border-box', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={label}>Seu nome <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>(opcional)</span></div>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                  maxLength={60} placeholder="Como quer ser identificado"
                  style={{ width: '100%', boxSizing: 'border-box', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={label}>Compraria a mentoria novamente?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ v: true, t: 'Sim' }, { v: false, t: 'Não' }].map((o) => {
                    const on = form.compraria === o.v
                    return (
                      <button key={o.t} type="button" onClick={() => setForm((s) => ({ ...s, compraria: o.v }))}
                        style={{
                          flex: 1, padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${on ? C.accent : C.border}`,
                          background: on ? 'rgba(22,199,132,0.14)' : 'transparent',
                          color: on ? C.accent : C.text,
                        }}>
                        {o.t}
                      </button>
                    )
                  })}
                </div>
              </div>

              {form.compraria === false && (
                <div style={{ marginBottom: 16 }}>
                  <div style={label}>O que faltou? <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>(opcional — fica visível só pra você)</span></div>
                  <textarea
                    value={form.motivo_nao}
                    onChange={(e) => setForm((s) => ({ ...s, motivo_nao: e.target.value }))}
                    rows={3} maxLength={400}
                    style={{ width: '100%', boxSizing: 'border-box', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, resize: 'vertical' }}
                  />
                </div>
              )}

              {erro && <p style={{ color: '#ff6b6b', fontSize: 14 }}>{erro}</p>}

              <button type="button" onClick={enviar} disabled={sending}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: C.accent, color: '#000', fontWeight: 800, fontSize: 16,
                  cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1,
                }}>
                {sending ? 'Enviando…' : 'Enviar avaliação'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
