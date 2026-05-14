import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import {
  Chart, CategoryScale, LinearScale,
  BarElement, BarController,
  LineElement, LineController,
  PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
try { Chart.register(CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Tooltip, Legend, Filler) } catch(_) {}

const s = {
  accent:'#00d4aa', dark:'#080c12', surface:'#0f1520',
  card:'#131b28', border:'rgba(255,255,255,0.07)',
  text:'#e8edf5', muted:'#6b7a99',
}
const MN = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const fmt = (v,d=2) => v==null||isNaN(v)?'—':`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}`

function MetCard({label,value,color,sub}) {
  return (
    <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,padding:'14px 16px'}}>
      <div style={{fontSize:10,color:s.muted,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{label}</div>
      <div style={{fontSize:20,fontWeight:800,color:color||s.text,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:s.muted,marginTop:4}}>{sub}</div>}
    </div>
  )
}

// ── Curva de capital ─────────────────────────────────────────────────────────
function EquityChart({ops}) {
  const ref = useRef(); const chart = useRef()
  useEffect(()=>{
    if(!ref.current||!ops.length) return
    if(chart.current) chart.current.destroy()
    const sorted = [...ops].sort((a,b)=>(a.abertura||'').localeCompare(b.abertura||''))
    let acc=0; const labels=[],data=[],dd=[]
    let peak=0
    sorted.forEach((op,i)=>{
      acc+=op.res_op||0
      if(acc>peak) peak=acc
      const step=Math.max(1,Math.floor(sorted.length/300))
      if(i%step===0||i===sorted.length-1){
        labels.push((op.abertura||'').split(' ')[0])
        data.push(parseFloat(acc.toFixed(2)))
        dd.push(parseFloat((peak-acc).toFixed(2)))
      }
    })
    chart.current=new Chart(ref.current.getContext('2d'),{
      type:'line',
      data:{labels,datasets:[
        {label:'Capital',data,borderColor:s.accent,backgroundColor:s.accent+'18',fill:true,tension:0.3,pointRadius:0,borderWidth:2,yAxisID:'y'},
        {label:'Drawdown',data:dd.map(v=>-v),borderColor:'rgba(240,96,96,0.6)',backgroundColor:'rgba(240,96,96,0.08)',fill:true,tension:0.3,pointRadius:0,borderWidth:1.5,yAxisID:'y'},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:true,labels:{color:s.muted,font:{size:11}}},
          tooltip:{callbacks:{label:c=>`R$ ${Number(c.raw).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}}},
        scales:{
          x:{display:false},
          y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:s.muted,font:{size:10},callback:v=>`R$${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}`}}
        }
      }
    })
    return ()=>{ if(chart.current) chart.current.destroy() }
  },[ops])
  return <div style={{height:220}}><canvas ref={ref}/></div>
}

// ── Gráfico mensal ───────────────────────────────────────────────────────────
function MonthlyChart({ops}) {
  const ref = useRef(); const chart = useRef()
  useEffect(()=>{
    if(!ref.current||!ops.length) return
    if(chart.current) chart.current.destroy()
    const monthly={}
    ops.forEach(op=>{
      const pts=(op.abertura||'').split(' ')[0].split('/')
      if(pts.length===3){const k=`${pts[2]}-${pts[1].padStart(2,'0')}`;monthly[k]=(monthly[k]||0)+(op.res_op||0)}
    })
    const keys=Object.keys(monthly).sort().slice(-24)
    const labels=keys.map(k=>{const[y,m]=k.split('-');return `${MN[parseInt(m)-1]}/${y.slice(2)}`})
    const data=keys.map(k=>parseFloat(monthly[k].toFixed(2)))
    chart.current=new Chart(ref.current.getContext('2d'),{
      type:'bar',
      data:{labels,datasets:[{data,backgroundColor:data.map(v=>v>=0?'rgba(52,212,126,0.75)':'rgba(240,96,96,0.75)'),borderColor:data.map(v=>v>=0?'#34d47e':'#f06060'),borderWidth:1,borderRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`R$ ${Number(c.raw).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}}},
        scales:{
          x:{ticks:{color:s.muted,font:{size:10}},grid:{color:'rgba(255,255,255,0.03)'}},
          y:{ticks:{color:s.muted,font:{size:10},callback:v=>`R$${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}`},grid:{color:'rgba(255,255,255,0.06)'}}
        }
      }
    })
    return ()=>{ if(chart.current) chart.current.destroy() }
  },[ops])
  return <div style={{height:200}}><canvas ref={ref}/></div>
}

// ── Aba Visão Geral ──────────────────────────────────────────────────────────
function VisaoGeralTab({portfolio,metrics,ops}) {
  const pf = metrics.profitFactor||0
  const fr = metrics.nMonths>0 ? ((metrics.totalBruto||0)/Math.max(metrics.maxDD||1,1))*(12/metrics.nMonths) : 0
  const score6015 = parseFloat((pf + Math.max(0,fr)).toFixed(2))
  const scoreLabel = score6015>=6?{l:'Excelente',c:'#34d47e'}:score6015>=4?{l:'Bom',c:'#4f8ef7'}:score6015>=2.5?{l:'Regular',c:'#f5a623'}:{l:'Fraco',c:'#f06060'}
  const mesesPos = (() => {
    const m={}; ops.forEach(op=>{const pts=(op.abertura||'').split(' ')[0].split('/');if(pts.length===3){const k=`${pts[2]}-${pts[1]}`;m[k]=(m[k]||0)+(op.res_op||0)}})
    const vals=Object.values(m); return {pos:vals.filter(v=>v>0).length, total:vals.length}
  })()

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:20}}>
        <MetCard label="Total conta real" value={fmt(metrics.totalBruto)} color={(metrics.totalBruto||0)>=0?'#34d47e':'#f06060'}/>
        <MetCard label="Média mensal" value={fmt(metrics.avgMonthly)} color={(metrics.avgMonthly||0)>=0?'#34d47e':'#f06060'}/>
        <MetCard label="Win Rate" value={(metrics.winRate||0).toFixed(1)+'%'} color={(metrics.winRate||0)>=55?'#34d47e':'#f5a623'}/>
        <MetCard label="Profit Factor" value={(pf).toFixed(2)} color={pf>=1.5?'#34d47e':'#f5a623'}/>
        <MetCard label="Max Drawdown" value={fmt(metrics.maxDD)} color="#f06060"/>
        <MetCard label="M.6015" value={score6015} color={scoreLabel.c} sub={scoreLabel.l}/>
        <MetCard label="Meses positivos" value={`${mesesPos.pos} / ${mesesPos.total}`} color={mesesPos.pos/Math.max(mesesPos.total,1)>=0.6?'#34d47e':'#f5a623'}/>
        <MetCard label="Operações" value={ops.length.toLocaleString('pt-BR')}/>
      </div>

      {/* Conta Real badge */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,padding:'10px 16px',background:'rgba(52,212,126,0.08)',border:'1px solid rgba(52,212,126,0.3)',borderRadius:10}}>
        <span style={{fontSize:14}}>🔴</span>
        <span style={{fontSize:12,color:'#34d47e',fontWeight:600}}>Conta Real Verificada · Método 6015 · Trade Quant Lab</span>
      </div>

      {ops.length>0 && (
        <>
          <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,padding:'20px',marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:s.muted,marginBottom:14,textTransform:'uppercase',letterSpacing:'.05em'}}>Curva de capital + Drawdown</div>
            <EquityChart ops={ops}/>
          </div>
          <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,padding:'20px'}}>
            <div style={{fontSize:12,fontWeight:600,color:s.muted,marginBottom:14,textTransform:'uppercase',letterSpacing:'.05em'}}>Resultado mensal (últimos 24 meses)</div>
            <MonthlyChart ops={ops}/>
          </div>
        </>
      )}
    </div>
  )
}

// ── Aba Mensal ───────────────────────────────────────────────────────────────
function MensalTab({ops}) {
  const monthly={}
  ops.forEach(op=>{
    const pts=(op.abertura||'').split(' ')[0].split('/')
    if(pts.length===3){const y=pts[2],m=parseInt(pts[1])-1;if(!monthly[y])monthly[y]=Array(12).fill(null);monthly[y][m]=(monthly[y][m]||0)+(op.res_op||0)}
  })
  const years=Object.keys(monthly).sort().reverse()
  if(!years.length) return <div style={{color:s.muted,textAlign:'center',padding:40}}>Sem dados mensais</div>
  return (
    <div>
      {years.map(year=>{
        const total=monthly[year].reduce((a,v)=>a+(v||0),0)
        return (
          <div key={year} style={{marginBottom:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontSize:15,fontWeight:700,color:s.accent}}>{year}</span>
              <span style={{fontSize:13,fontWeight:700,color:total>=0?'#34d47e':'#f06060'}}>Total: {fmt(total)}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
              {monthly[year].map((val,mi)=>(
                <div key={mi} style={{background:val!==null?(val>=0?'rgba(52,212,126,0.12)':'rgba(240,96,96,0.12)'):'rgba(255,255,255,0.03)',border:`1px solid ${val!==null?(val>=0?'rgba(52,212,126,0.3)':'rgba(240,96,96,0.3)'):s.border}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:s.muted,marginBottom:4}}>{MN[mi]}</div>
                  <div style={{fontSize:11,fontWeight:700,color:val!==null?(val>=0?'#34d47e':'#f06060'):'rgba(255,255,255,0.15)'}}>{val!==null?fmt(val):'—'}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:6,textAlign:'right',fontSize:12,color:s.muted}}>
              Meses positivos: <span style={{fontWeight:700,color:'#34d47e'}}>{monthly[year].filter(v=>v!==null&&v>0).length}</span> /&nbsp;
              <span>{monthly[year].filter(v=>v!==null).length}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Aba Estratégias ──────────────────────────────────────────────────────────
function EstrategiasTab({robots,ops}) {
  const byRobot={}
  ops.forEach(op=>{const k=op.ativo;if(!byRobot[k])byRobot[k]=[];byRobot[k].push(op)})
  const grand=ops.reduce((a,o)=>a+(o.res_op||0),0)
  const rows=robots.map(r=>{
    const rops=byRobot[r.name]||[]
    const wins=rops.filter(o=>o.res_op>0).length
    const total=rops.reduce((a,o)=>a+(o.res_op||0),0)
    return {name:r.name,lotes:r.lotes||1,nOps:rops.length,wr:rops.length?(wins/rops.length)*100:0,total}
  }).sort((a,b)=>b.total-a.total)
  return (
    <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,overflow:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:s.surface}}>
            {['Estratégia','Lotes','Ops','Win Rate','Resultado','% do total'].map((h,i)=>(
              <th key={h} style={{padding:'10px 14px',textAlign:i<2?'left':'right',fontWeight:600,color:s.muted,fontSize:11,textTransform:'uppercase',letterSpacing:'.05em',borderBottom:`1px solid ${s.border}`}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>{
            const pct=grand!==0?(r.total/Math.abs(grand))*100:0
            return (
              <tr key={i} style={{borderBottom:'rgba(255,255,255,0.03) solid 1px'}}>
                <td style={{padding:'10px 14px',fontWeight:600}}>{r.name}</td>
                <td style={{padding:'10px 14px',color:s.muted}}>{r.lotes}×</td>
                <td style={{padding:'10px 14px',textAlign:'right',color:s.muted}}>{r.nOps||'—'}</td>
                <td style={{padding:'10px 14px',textAlign:'right',color:r.wr>=55?'#34d47e':'#f5a623'}}>{r.nOps?r.wr.toFixed(1)+'%':'—'}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:r.total>=0?'#34d47e':'#f06060'}}>{r.nOps?fmt(r.total):'—'}</td>
                <td style={{padding:'10px 14px',textAlign:'right',color:pct>=0?'#34d47e':'#f06060'}}>{r.nOps?`${pct>=0?'+':''}${pct.toFixed(1)}%`:'—'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{borderTop:`1px solid ${s.border}`,background:s.surface}}>
            <td colSpan={3} style={{padding:'10px 14px',fontWeight:700,fontSize:12,color:s.muted}}>Total</td>
            <td/>
            <td style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:grand>=0?'#34d47e':'#f06060'}}>{fmt(grand)}</td>
            <td/>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function PortfolioDetailPage() {
  const {id} = useParams()
  const navigate = useNavigate()
  const {mentPortfolios, mentOps, loading} = useData()
  const [tab,setTab] = useState('Visão Geral')
  const [data,setData] = useState(null)
  const [error,setError] = useState(null)

  useEffect(()=>{
    if(!mentPortfolios?.length) return
    // mentOps pode ser vazio — tratar abaixo
    try {
      const p = mentPortfolios.find(p=>p.id===parseInt(id))
      if(!p){setError('Portfólio não encontrado');return}
      const robots = typeof p.robots_json==='string'?JSON.parse(p.robots_json):(p.robots_json||[])
      if(!robots.length){setError('Sem estratégias configuradas');return}
      const names = new Set(robots.map(r=>r.name))
      const ops = (mentOps||[]).filter(op=>names.has(op.ativo)).map(op=>{
        const r=robots.find(r=>r.name===op.ativo)
        return {...op, res_op:(op.res_op||0)*(r?.lotes||1)}
      })
      // Métricas
      if(!ops.length){ setData({portfolio:p,robots,ops:[],metrics:{totalBruto:0,profitFactor:0,winRate:0,avgMonthly:0,nMonths:0,nRobots:robots.length,maxDD:0}}); return }
      const wins=ops.filter(o=>o.res_op>0).length
      const totalBruto=ops.reduce((a,o)=>a+(o.res_op||0),0)
      const gainSum=ops.filter(o=>o.res_op>0).reduce((a,o)=>a+o.res_op,0)
      const lossSum=Math.abs(ops.filter(o=>o.res_op<0).reduce((a,o)=>a+o.res_op,0))
      const profitFactor=lossSum>0?gainSum/lossSum:gainSum>0?99:0
      const winRate=ops.length?(wins/ops.length)*100:0
      const monthly={}
      ops.forEach(op=>{const pts=(op.abertura||'').split(' ')[0].split('/');if(pts.length===3){const k=`${pts[2]}-${pts[1]}`;monthly[k]=(monthly[k]||0)+op.res_op}})
      const vals=Object.values(monthly)
      const avgMonthly=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0
      let peak=0,maxDD=0,acc=0
      const sortedOps=ops.slice().sort((a,b)=>(a.abertura||'').localeCompare(b.abertura||''))
      sortedOps.forEach(op=>{
        acc+=op.res_op;if(acc>peak)peak=acc;const dd=peak-acc;if(dd>maxDD)maxDD=dd
      })
      setData({portfolio:p,robots,ops,metrics:{totalBruto,profitFactor,winRate,avgMonthly,nMonths:vals.length,nRobots:robots.length,maxDD}})
    } catch(e){console.error(e);setError('Erro: '+e.message)}
  },[mentPortfolios,mentOps,id])

  const TABS=['Visão Geral','Mensal','Estratégias']

  if(loading) return <div style={{background:s.dark,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted}}>Carregando...</div>
  if(error) return <div style={{background:s.dark,minHeight:'100vh',color:s.text,padding:40}}><button onClick={()=>navigate('/portfolios-recomendados')} style={{background:'none',border:'none',color:s.muted,cursor:'pointer',fontSize:13,marginBottom:20}}>← Voltar</button><div style={{color:'#f06060'}}>{error}</div></div>
  if(!data) return <div style={{background:s.dark,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted}}>Calculando...</div>

  const {portfolio,robots,ops,metrics} = data

  return (
    <div style={{background:s.dark,minHeight:'100vh',color:s.text}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px'}}>
        <button onClick={()=>navigate('/portfolios-recomendados')} style={{background:'none',border:'none',color:s.muted,cursor:'pointer',fontSize:13,marginBottom:20,display:'flex',alignItems:'center',gap:6}}>
          ← Voltar aos portfólios
        </button>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:800,marginBottom:6}}>{portfolio.name}</h1>
          <div style={{display:'flex',gap:16,color:s.muted,fontSize:13,flexWrap:'wrap',alignItems:'center'}}>
            <span>{robots.length} estratégias</span>
            <span>{ops.length.toLocaleString('pt-BR')} operações</span>
            <span>{metrics.nMonths} meses</span>
            <span style={{fontSize:11,fontWeight:700,background:'rgba(52,212,126,0.15)',border:'1px solid rgba(52,212,126,0.4)',color:'#34d47e',padding:'2px 10px',borderRadius:99}}>🔴 CONTA REAL</span>
          </div>
        </div>
        <div style={{display:'flex',gap:2,borderBottom:`1px solid ${s.border}`,marginBottom:24}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',padding:'9px 18px',fontSize:13,fontWeight:tab===t?700:400,color:tab===t?s.accent:s.muted,borderBottom:tab===t?`2px solid ${s.accent}`:'2px solid transparent',cursor:'pointer',marginBottom:-1,transition:'color .15s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab==='Visão Geral'&&<VisaoGeralTab portfolio={portfolio} metrics={metrics} ops={ops}/>}
        {tab==='Mensal'&&<MensalTab ops={ops}/>}
        {tab==='Estratégias'&&<EstrategiasTab robots={robots} ops={ops}/>}
        <div style={{marginTop:36,padding:'24px',background:`${s.accent}0d`,border:`1px solid ${s.accent}33`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontWeight:700,marginBottom:4}}>Quer operar o {portfolio.name}?</div>
            <div style={{fontSize:13,color:s.muted}}>Entre em contato para saber como começar.</div>
          </div>
          <a href={`https://wa.me/5553999793260?text=${encodeURIComponent(`Olá! Tenho interesse no portfólio ${portfolio.name}.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:8,background:s.accent,color:'#000',padding:'12px 24px',borderRadius:8,fontWeight:800,fontSize:14,textDecoration:'none'}}>
            💬 Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
