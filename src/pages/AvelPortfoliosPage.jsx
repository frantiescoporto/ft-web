import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { fmtNum } from '../lib/analytics.js'

const s = {
  accent:'#00d4aa', dark:'#080c12', surface:'#0f1520',
  card:'#131b28', border:'rgba(255,255,255,0.07)',
  text:'#e8edf5', muted:'#6b7a99', warning:'#f5a623',
}

const LOGO_LABELS = {
  '6015':'Método 6015','nelogica':'Nelogica','smartlab':'SmartLab',
  'frantiesco':'Frantiesco','avel':'Avel','ontick':'OnTick','liberdade':'Liberdade',
}

function fmt(v) {
  if (v==null||isNaN(v)) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
}

export default function AvelPortfoliosPage() {
  const navigate = useNavigate()
  const { mentPortfolios, mentOps, loading } = useData()
  const [metrics, setMetrics] = useState({})
  const [filterLogo, setFilterLogo] = useState('all')

  useEffect(()=>{
    if(!mentOps?.length||!mentPortfolios?.length) return
    const opsByName={}
    mentOps.forEach(op=>{const k=op.ativo;if(!opsByName[k])opsByName[k]=[];opsByName[k].push(op)})
    const pm={}
    for(const p of mentPortfolios){
      try{
        const robots=typeof p.robots_json==='string'?JSON.parse(p.robots_json):(p.robots_json||[])
        if(!robots.length) continue
        const ops=robots.flatMap(r=>(opsByName[r.name]||[]).map(op=>({...op,res_op:(op.res_op||0)*(r.lotes||1)})))
        if(!ops.length){pm[p.id]={noOps:true,robotsList:robots};continue}
        const wins=ops.filter(o=>o.res_op>0).length
        const totalBruto=ops.reduce((a,o)=>a+o.res_op,0)
        const gainSum=ops.filter(o=>o.res_op>0).reduce((a,o)=>a+o.res_op,0)
        const lossSum=Math.abs(ops.filter(o=>o.res_op<0).reduce((a,o)=>a+o.res_op,0))
        const profitFactor=lossSum>0?gainSum/lossSum:gainSum>0?99:0
        const winRate=ops.length?(wins/ops.length)*100:0
        const monthly={}
        ops.forEach(op=>{const pts=(op.abertura||'').split(' ')[0].split('/');if(pts.length===3){const k=`${pts[2]}-${pts[1]}`;monthly[k]=(monthly[k]||0)+op.res_op}})
        const vals=Object.values(monthly)
        const avgMonthly=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0
        pm[p.id]={totalBruto,profitFactor,winRate,avgMonthly,nMonths:vals.length,nRobots:robots.length,robotsList:robots}
      } catch(e){}
    }
    setMetrics(pm)
  },[mentOps,mentPortfolios])

  const logos = [...new Set(mentPortfolios.map(p=>p.logo||'none'))].filter(Boolean).sort()
  const filtered = filterLogo==='all' ? mentPortfolios : mentPortfolios.filter(p=>(p.logo||'none')===filterLogo)

  if(loading) return <div style={{background:s.dark,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted}}>Carregando...</div>

  return (
    <div style={{background:s.dark,minHeight:'100vh',color:s.text}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'40px 32px'}}>

        {/* Header Avel */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <div style={{fontSize:11,fontWeight:700,background:'rgba(245,166,35,0.15)',border:'1px solid rgba(245,166,35,0.4)',color:s.warning,padding:'3px 12px',borderRadius:99,letterSpacing:'.06em'}}>
            ÁREA AVEL · ACESSO RESTRITO
          </div>
        </div>

        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:28,fontWeight:800,marginBottom:6}}>Todos os Portfólios</h1>
          <p style={{color:s.muted,fontSize:14}}>{filtered.length} portfólios · Conta real · Método 6015</p>
        </div>

        {/* Filtro por tipo */}
        <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterLogo('all')}
            style={{padding:'5px 14px',borderRadius:99,border:`1px solid ${filterLogo==='all'?s.accent:s.border}`,background:filterLogo==='all'?s.accent+'20':'transparent',color:filterLogo==='all'?s.accent:s.muted,fontSize:12,fontWeight:filterLogo==='all'?700:400,cursor:'pointer'}}>
            Todos {mentPortfolios.length}
          </button>
          {logos.map(l=>(
            <button key={l} onClick={()=>setFilterLogo(l)}
              style={{padding:'5px 14px',borderRadius:99,border:`1px solid ${filterLogo===l?s.accent:s.border}`,background:filterLogo===l?s.accent+'20':'transparent',color:filterLogo===l?s.accent:s.muted,fontSize:12,fontWeight:filterLogo===l?700:400,cursor:'pointer'}}>
              {LOGO_LABELS[l]||l} {mentPortfolios.filter(p=>(p.logo||'none')===l).length}
            </button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {filtered.map(p=>{
            const m=metrics[p.id]
            return (
              <div key={p.id}
                onClick={()=>navigate(`/avel/portfolios/${p.id}`)}
                style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:14,padding:'22px',cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=s.accent+'88';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=s.border;e.currentTarget.style.transform='translateY(0)'}}>

                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.06)',padding:'2px 8px',borderRadius:99,color:s.muted}}>
                    {LOGO_LABELS[p.logo||'none']||p.logo||'—'}
                  </span>
                  {m?.noOps && <span style={{fontSize:10,color:'#f5a623',background:'rgba(245,166,35,0.1)',padding:'2px 8px',borderRadius:99}}>Sem ops</span>}
                </div>

                <div style={{fontWeight:700,fontSize:16,marginBottom:10}}>{p.name}</div>

                {m&&!m.noOps?(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                    {[
                      {l:'Total',v:fmt(m.totalBruto||0),c:(m.totalBruto||0)>=0?'#34d47e':'#f06060'},
                      {l:'Méd/mês',v:fmt(m.avgMonthly||0),c:(m.avgMonthly||0)>=0?'#34d47e':'#f06060'},
                      {l:'Win Rate',v:(m.winRate||0).toFixed(0)+'%',c:(m.winRate||0)>=55?'#34d47e':'#f5a623'},
                      {l:'P.Factor',v:(m.profitFactor||0).toFixed(2),c:(m.profitFactor||0)>=1.5?'#34d47e':'#f5a623'},
                      {l:'Estratégias',v:m.nRobots,c:s.text},
                      {l:'Meses',v:m.nMonths,c:s.text},
                    ].map((st,i)=>(
                      <div key={i} style={{background:s.surface,borderRadius:8,padding:'6px',textAlign:'center'}}>
                        <div style={{fontSize:9,color:s.muted,marginBottom:2,textTransform:'uppercase'}}>{st.l}</div>
                        <div style={{fontSize:11,fontWeight:700,color:st.c}}>{st.v}</div>
                      </div>
                    ))}
                  </div>
                ):<div style={{fontSize:12,color:s.muted}}>{m?.noOps?'Sem operações mapeadas':'Calculando...'}</div>}

                <div style={{marginTop:12,fontSize:12,color:s.accent,fontWeight:600,textAlign:'right'}}>Ver análise →</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
