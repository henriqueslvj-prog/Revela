// Acesso a dados. Usa o Supabase quando configurado; senão, uma base de demonstração
// guardada no navegador (localStorage). Os módulos não precisam saber qual dos dois está ativo.
import { supabase, DEMO } from './supabase.js'
import { seed } from './demo.js'

const KEY = 'revela_demo_v1'
let mem = null

const persist = (s) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* armazenamento indisponível */ }
}
const store = () => {
  if (mem) return mem
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { mem = JSON.parse(raw); return mem }
  } catch { /* ignora */ }
  mem = seed()
  persist(mem)
  return mem
}
const clone = (x) => JSON.parse(JSON.stringify(x))
const uid = () => 'x' + Math.random().toString(36).slice(2, 10)

export function resetDemo() {
  mem = seed()
  persist(mem)
}

const sortRecent = (rows) => [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

export async function listRows(table) {
  if (DEMO) return sortRecent(clone(store()[table] || []))
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveRow(table, id, payload) {
  if (DEMO) {
    const s = store()
    const rows = s[table]
    const now = new Date().toISOString()
    if (id) {
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) throw new Error('Registro não encontrado.')
      rows[i] = { ...rows[i], ...payload, updated_at: now }
    } else {
      const row = { id: uid(), ...payload, created_at: now, updated_at: now }
      if (table === 'contratos') {
        const max = rows.reduce((m, r) => Math.max(m, parseInt(String(r.numero).replace(/\D/g, ''), 10) || 0), 0)
        row.numero = 'CT-' + String(max + 1).padStart(4, '0')
      }
      rows.unshift(row)
    }
    persist(s)
    return
  }
  const res = id
    ? await supabase.from(table).update(payload).eq('id', id)
    : await supabase.from(table).insert(payload)
  if (res.error) throw res.error
}

// Remove vínculos como o banco faz (cliente protegido; projeto solta os vínculos).
const DEMO_LINKS = {
  clientes: { restrict: [['projetos', 'cliente_id'], ['contratos', 'cliente_id']] },
  projetos: { clear: [['contratos', 'projeto_id'], ['prazos', 'projeto_id'], ['sessoes', 'projeto_id']] },
}

export async function deleteRow(table, id) {
  if (DEMO) {
    const s = store()
    const rule = DEMO_LINKS[table]
    if (rule?.restrict?.some(([t, col]) => s[t].some((r) => r[col] === id))) {
      const e = new Error('vinculado')
      e.code = '23503'
      throw e
    }
    rule?.clear?.forEach(([t, col]) => s[t].forEach((r) => { if (r[col] === id) r[col] = null }))
    s[table] = s[table].filter((r) => r.id !== id)
    persist(s)
    return
  }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

// Equipe ativa para escolher responsáveis: [{ id, full_name, role }]
export async function listTeam() {
  if (DEMO) return clone(store().equipe)
  const { data, error } = await supabase.rpc('get_active_team_members')
  if (error) throw error
  return data || []
}
