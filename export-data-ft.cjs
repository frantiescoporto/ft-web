/**
 * export-data-ft.cjs — Frantiesco Trader
 * Uso: node export-data-ft.cjs --db "C:\caminho\robots.db"
 */
'use strict'

console.log('[ft-export] Iniciando...')

const path = require('path')
const fs   = require('fs')
const os   = require('os')

const args   = process.argv.slice(2)
const getArg = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }

const DB_PATH = getArg('--db') || path.join(os.homedir(), 'AppData', 'Roaming', 'Trade Quant Lab', 'robots.db')
const OUT_DIR = path.join(__dirname, 'public', 'data')

console.log('[ft-export] Banco:', DB_PATH)
console.log('[ft-export] Saída:', OUT_DIR)

if (!fs.existsSync(DB_PATH)) {
  console.error('ERRO: Banco não encontrado:', DB_PATH)
  process.exit(1)
}

let Database
try {
  Database = require('better-sqlite3')
  console.log('[ft-export] better-sqlite3 OK')
} catch(e) {
  console.error('ERRO: better-sqlite3 não encontrado. Rode: npm install better-sqlite3')
  console.error(e.message)
  process.exit(1)
}

const db = new Database(DB_PATH, { readonly: true })
console.log('[ft-export] Banco aberto com sucesso')

// Ordenar datas DD/MM/YYYY corretamente
const dateKey = s => {
  try { const p=s.split(' ')[0].split('/'); return +p[2]*10000+(+p[1])*100+(+p[0]) } catch{return 0}
}

// Robôs
console.log('[ft-export] Lendo robôs...')
const robotRows = db.prepare('SELECT id, name, ativo, tipo, desagio, strategy_type, timeframe, platform, observation FROM robots ORDER BY name').all()
console.log('[ft-export] Total robôs:', robotRows.length)

const stmtOps  = db.prepare('SELECT num, abertura, fechamento, lado, qtd, res_op, res_op_pct, tempo FROM operations WHERE robot_id = ? ORDER BY abertura')
const stmtReal = db.prepare('SELECT abertura, fechamento, lado, qtd, res_op FROM real_operations WHERE robot_id = ? ORDER BY abertura')
const stmtPer  = db.prepare('SELECT in_sample_start, in_sample_end, out_sample_start, out_sample_end, paper_start, paper_end, periods_json FROM periods WHERE robot_id = ?')

const robots = []
for (const r of robotRows) {
  const ops     = stmtOps.all(r.id).sort((a,b) => dateKey(a.abertura||'') - dateKey(b.abertura||''))
  const realOps = (() => { try { return stmtReal.all(r.id).sort((a,b) => dateKey(a.abertura||'') - dateKey(b.abertura||'')) } catch { return [] } })()
  const periods = (() => { try { return stmtPer.get(r.id) || {} } catch { return {} } })()
  robots.push({ id:r.id, name:r.name, ativo:r.ativo, platform:r.platform||'profit',
    strategy_type:r.strategy_type||'', timeframe:r.timeframe||'',
    tipo:r.tipo||'backtest', desagio:r.desagio||0, observation:r.observation||'',
    periods, operations:ops, realOps })
}

// Portfólios
let portfolios = []
try { portfolios = db.prepare('SELECT id, name, robots_config FROM portfolios ORDER BY name').all() } catch{}
console.log('[ft-export] Portfólios LAB:', portfolios.length)

// Mentorados
let mentPortfolios = []
try {
  mentPortfolios = db.prepare('SELECT id, name, robots_json, capital_inicial, cor, logo, config_versions FROM mentorados_portfolios ORDER BY name').all()
} catch(e) { console.log('[ft-export] Sem mentorados_portfolios:', e.message) }
console.log('[ft-export] Portfólios Mentorados:', mentPortfolios.length)
mentPortfolios.forEach(p => console.log('  -', p.name, '| logo:', p.logo||'?'))

// Dash ops
let dashOps = []
try { dashOps = db.prepare('SELECT abertura, fechamento, ativo, lado, qtd, res_op, res_op_pct FROM dash_operations ORDER BY abertura').all() } catch{}
console.log('[ft-export] Ops My Dash:', dashOps.length)

db.close()

// Salvar
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const files = [
  { name:'robots.json',                data:robots },
  { name:'portfolios.json',            data:portfolios },
  { name:'mentorados-portfolios.json', data:mentPortfolios },
  { name:'mentorados-ops.json',        data:dashOps },
]

for (const f of files) {
  const p = path.join(OUT_DIR, f.name)
  fs.writeFileSync(p, JSON.stringify(f.data, null, 2))
  const kb = (fs.statSync(p).size/1024).toFixed(0)
  console.log(`[ft-export] ✅ ${f.name} → ${p} (${kb} KB)`)
}

console.log('\n[ft-export] CONCLUÍDO:', new Date().toLocaleString('pt-BR'))
console.log('[ft-export] Próximo: GitHub Desktop → Commit → Push\n')
