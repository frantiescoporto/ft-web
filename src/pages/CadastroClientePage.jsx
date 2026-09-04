import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

/* ============================================================================
 *  Cadastro de clientes — grava na tabela `clientes` do Supabase (privada).
 * ========================================================================== */

const TEMPO = ['Menos de 1 mês', '1 a 3 meses', '3 a 6 meses', '6 a 12 meses', 'Mais de 12 meses']
const PRODUTOS = ['Mentoria Método 6015', 'Mentoria SmartLab', 'Combo Hunter', 'OnTick']
const CORRETORAS = ['XP', 'Rico', 'Clear', 'Genial', 'CM Capital', 'Toro', 'BTG', 'Inter', 'Master', 'Outra']
const ASSESSORIAS = ['AVEL', 'Outro']
const PROFIT = ['Pro', 'Ultra']
const MODULOS = ['Basic', 'Plus', 'Premium 250', 'Premium 500', 'Premium 1000', 'Premium 3000', 'Premium Ilimitado']
const PORTFOLIOS = ['5k', '10k', '15k', '20k', '25k', '30k', '35k', 'Não sei / outro']
const EH_MENTORIA = (p) => p.includes('Mentoria Método 6015') || p.includes('Mentoria SmartLab')

export default function CadastroClientePage() {
  const navigate = useNavigate()
  const [f, setF] = useState({ nome: '', telefone: '', tempo: '', produtos: [], corretora: '', assessoria: '', profit: '', modulo: '', portfolio: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const id = 'cad-fonts'
    if (document.getElementById(id)) return
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap'
    document.head.appendChild(l)
  }, [])

  const set = (k, v) => setF(s => {
    const next = { ...s, [k]: v }
    if (k === 'corretora' && v !== 'XP') next.assessoria = ''
    return next
  })
  const toggleProd = (p) => setF(s => ({ ...s, produtos: s.produtos.includes(p) ? s.produtos.filter(x => x !== p) : [...s.produtos, p] }))

  const enviar = async () => {
    setErro('')
    if (!f.nome.trim()) return setErro('Preencha seu nome.')
    if (!f.telefone.trim()) return setErro('Preencha seu telefone/WhatsApp.')
    if (!f.tempo) return setErro('Selecione há quanto tempo é cliente.')
    if (!f.produtos.length) return setErro('Marque ao menos um produto.')
    if (!f.corretora) return setErro('Selecione sua corretora.')
    if (!f.profit) return setErro('Selecione o Profit que usa.')
    if (!f.modulo) return setErro('Selecione o módulo de automação.')
    setEnviando(true)
    const { error } = await supabase.from('clientes').insert({
      nome: f.nome.trim(),
      telefone: f.telefone.trim(),
      tempo_cliente: f.tempo,
      produtos: f.produtos,
      corretora: f.corretora,
      assessoria: f.corretora === 'XP' ? (f.assessoria || null) : null,
      profit: f.profit,
      modulo: f.modulo,
      portfolio_mentoria: EH_MENTORIA(f.produtos) ? (f.portfolio || null) : null,
    })
    setEnviando(false)
    if (error) return setErro('Não foi possível enviar agora. Tente novamente em instantes.')
    setOk(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const Chip = ({ on, onClick, children }) => (
    <button type="button" className={`cad-chip${on ? ' on' : ''}`} onClick={onClick}>{on ? '✓ ' : ''}{children}</button>
  )
  const Group = ({ label, children, hint }) => (
    <div className="cad-group">
      <div className="cad-label">{label}{hint && <span className="cad-hint"> {hint}</span>}</div>
      <div className="cad-chips">{children}</div>
    </div>
  )

  return (
    <div className="cad">
      <style>{CSS}</style>
      <div className="cad-glow" />
      <div className="cad-wrap">
        <button onClick={() => navigate('/')} className="cad-back">← Início</button>

        {ok ? (
          <div className="cad-ok">
            <div className="cad-check">✓</div>
            <h1>Cadastro recebido!</h1>
            <p>Obrigado, {f.nome.split(' ')[0]}. Recebi seus dados e vou usar pra te atender melhor.</p>
          </div>
        ) : (
          <>
            <div className="cad-eyebrow">Frantiesco Trader · Cadastro</div>
            <h1 className="cad-h1">Me conta um pouco <span className="g">sobre você.</span></h1>
            <p className="cad-lede">São 2 minutos. Isso me ajuda a te dar o suporte certo e falar com você do jeito que faz sentido pro seu momento.</p>

            <div className="cad-group">
              <div className="cad-label">Nome</div>
              <input className="cad-input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome completo" maxLength={80} />
            </div>
            <div className="cad-group">
              <div className="cad-label">Telefone / WhatsApp</div>
              <input className="cad-input" value={f.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" maxLength={30} inputMode="tel" />
            </div>

            <Group label="Há quanto tempo é meu cliente?">
              {TEMPO.map(t => <Chip key={t} on={f.tempo === t} onClick={() => set('tempo', t)}>{t}</Chip>)}
            </Group>

            <Group label="Quais produtos você adquiriu?" hint="(pode marcar mais de um)">
              {PRODUTOS.map(p => <Chip key={p} on={f.produtos.includes(p)} onClick={() => toggleProd(p)}>{p}</Chip>)}
            </Group>

            {EH_MENTORIA(f.produtos) && (
              <Group label="Na mentoria, qual portfólio mais se aproxima do que você opera hoje?" hint="(opcional)">
                {PORTFOLIOS.map(p => <Chip key={p} on={f.portfolio === p} onClick={() => set('portfolio', f.portfolio === p ? '' : p)}>{p}</Chip>)}
              </Group>
            )}

            <Group label="Corretora">
              {CORRETORAS.map(c => <Chip key={c} on={f.corretora === c} onClick={() => set('corretora', c)}>{c}</Chip>)}
            </Group>

            {f.corretora === 'XP' && (
              <Group label="Escritório de assessoria">
                {ASSESSORIAS.map(a => <Chip key={a} on={f.assessoria === a} onClick={() => set('assessoria', f.assessoria === a ? '' : a)}>{a}</Chip>)}
              </Group>
            )}

            <Group label="Profit que usa">
              {PROFIT.map(p => <Chip key={p} on={f.profit === p} onClick={() => set('profit', p)}>Profit {p}</Chip>)}
            </Group>

            <Group label="Módulo de automação">
              {MODULOS.map(m => <Chip key={m} on={f.modulo === m} onClick={() => set('modulo', m)}>{m}</Chip>)}
            </Group>

            {erro && <p className="cad-erro">{erro}</p>}

            <button type="button" className="cad-enviar" onClick={enviar} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar cadastro'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const CSS = `
.cad{ --bg:#060809; --text:#F4F7FA; --muted:#8A93A0; --line:rgba(255,255,255,.09);
  --glass:rgba(255,255,255,.045); --tealA:#00E0B8; --cyanA:#38C6FF;
  --grad:linear-gradient(120deg,#00E0B8 0%,#38C6FF 55%,#5B8CFF 100%);
  position:relative; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden;
  font-family:'Geist',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; -webkit-font-smoothing:antialiased; }
.cad-glow{ position:absolute; left:50%; top:-40px; width:820px; height:420px; transform:translateX(-50%);
  background:radial-gradient(closest-side, rgba(0,224,184,.22), rgba(56,198,255,.10) 45%, transparent 72%); filter:blur(26px); z-index:0; }
.cad-wrap{ position:relative; z-index:2; max-width:640px; margin:0 auto; padding:26px 22px 70px; }
.cad-back{ background:none; border:none; color:var(--muted); cursor:pointer; font-size:14px; font-family:inherit; margin-bottom:22px; }
.cad-eyebrow{ font-family:inherit; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--cyanA); margin-bottom:16px; font-weight:600; }
.cad-h1{ font-weight:600; font-size:clamp(30px,5.5vw,48px); line-height:1.02; letter-spacing:-.035em; margin:0 0 14px; }
.cad-h1 .g{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.cad-lede{ color:var(--muted); font-size:16px; line-height:1.6; margin:0 0 34px; max-width:46ch; }

.cad-group{ margin-bottom:26px; }
.cad-label{ font-weight:600; font-size:15px; margin-bottom:12px; }
.cad-hint{ color:var(--muted); font-weight:400; font-size:13px; }
.cad-input{ width:100%; box-sizing:border-box; background:var(--glass); border:1px solid var(--line); border-radius:12px;
  padding:14px 16px; color:var(--text); font-size:15px; font-family:inherit; }
.cad-input:focus{ outline:none; border-color:var(--tealA); }
.cad-input::placeholder{ color:var(--muted); }

.cad-chips{ display:flex; flex-wrap:wrap; gap:9px; }
.cad-chip{ font-family:inherit; font-size:14px; font-weight:500; cursor:pointer; color:var(--text);
  background:var(--glass); border:1px solid var(--line); border-radius:999px; padding:10px 16px; transition:all .12s; }
.cad-chip:hover{ border-color:var(--tealA); }
.cad-chip.on{ background:rgba(0,224,184,.14); border-color:var(--tealA); color:var(--tealA); font-weight:600; }
.cad-chip:focus-visible{ outline:2px solid var(--cyanA); outline-offset:2px; }

.cad-erro{ color:#FF6B6B; font-size:14px; margin:4px 0 0; }
.cad-enviar{ width:100%; margin-top:20px; font-family:inherit; font-weight:700; font-size:16px; padding:16px; border:none; border-radius:12px;
  background:var(--grad); color:#04140f; cursor:pointer; box-shadow:0 12px 40px rgba(0,224,184,.24); }
.cad-enviar:disabled{ opacity:.65; cursor:wait; }

.cad-ok{ text-align:center; padding:60px 0; }
.cad-check{ width:64px; height:64px; margin:0 auto 20px; border-radius:50%; background:rgba(0,224,184,.14); border:1px solid var(--tealA);
  color:var(--tealA); font-size:30px; display:flex; align-items:center; justify-content:center; }
.cad-ok h1{ font-weight:600; font-size:30px; letter-spacing:-.02em; margin:0 0 10px; }
.cad-ok p{ color:var(--muted); font-size:16px; margin:0; }
`
