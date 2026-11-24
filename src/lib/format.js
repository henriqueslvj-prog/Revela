const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = () => iso(new Date())
export const addDaysISO = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

// Data local (sem deslocamento de fuso) a partir de 'AAAA-MM-DD' ou de um timestamp ISO.
const localDate = (s) => {
  s = String(s)
  if (s.length <= 10) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const dt = new Date(s)
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

// Dias entre hoje e a data (negativo = já passou).
export const daysUntil = (s) => {
  if (!s) return null
  const t = localDate(s)
  const n = new Date()
  const n0 = new Date(n.getFullYear(), n.getMonth(), n.getDate())
  return Math.round((t - n0) / 86400000)
}

export const fmtDate = (v) => {
  if (!v) return '—'
  const s = String(v)
  if (s.length <= 10) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  const dt = new Date(s)
  return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR')
}

export const fmtDateTime = (v) => {
  if (!v) return '—'
  const dt = new Date(v)
  return isNaN(dt)
    ? '—'
    : dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const fmtMoney = (v) =>
  v === null || v === undefined || v === ''
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Valor do <input type="datetime-local"> <-> timestamp ISO
export const toLocalInput = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d)) return ''
  return `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

// Situação de um prazo, calculada a partir do status e da data limite.
export const prazoSituacao = (row) => {
  if (row.status === 'concluido') return { label: 'Concluído', tone: 'muted' }
  if (row.status === 'cancelado') return { label: 'Cancelado', tone: 'muted' }
  const d = daysUntil(row.data_limite)
  if (d === null) return { label: 'Sem data', tone: 'neutral' }
  if (d < 0) return { label: 'Atrasado', tone: 'hot' }
  if (d <= 3) return { label: 'A vencer', tone: 'warn' }
  return { label: 'Em dia', tone: 'neutral' }
}

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)
export const longToday = () =>
  capitalize(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

// Mensagens de erro em português para o usuário.
export const friendlyError = (e) => {
  const code = e?.code
  const msg = String(e?.message || e || '')
  if (code === '23503' || /foreign key|vinculad/i.test(msg)) {
    return 'Este registro está vinculado a outros (projetos, contratos ou prazos) e não pode ser excluído.'
  }
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'Você não tem permissão para esta ação. Fale com o administrador.'
  }
  if (code === '42P01' || /does not exist|schema cache/i.test(msg)) {
    return 'As tabelas do Revela ainda não existem no banco. Execute o arquivo supabase/revela-v0.1.sql.'
  }
  return msg || 'Não foi possível concluir a ação.'
}
