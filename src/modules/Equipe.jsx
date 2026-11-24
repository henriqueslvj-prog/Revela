import { useEffect, useState } from 'react'
import { supabase, DEMO } from '../lib/supabase.js'
import { listTeam } from '../lib/data.js'
import { Icon, Modal } from '../components/ui.jsx'
import { MODULES, ROLES, ROLE_PRESETS } from '../lib/schema.js'
import { fmtDate } from '../lib/format.js'

const ACTIONS = [['view', 'Ver'], ['create', 'Criar'], ['edit', 'Editar'], ['delete', 'Excluir']]
const EMPTY = { id: '', name: '', email: '', role: 'atendimento', status: 'ativo', password: '' }

const fnError = async (res) => {
  try { return (await res.error.context.json()).error } catch { return res.error?.message || 'Não foi possível concluir.' }
}

async function savePermissions(userId, map) {
  await supabase.from('user_permissions').delete().eq('user_id', userId)
  const rows = MODULES.map(([m]) => ({ m, x: map[m] || {} }))
    .filter(({ x }) => x.view || x.create || x.edit || x.delete)
    .map(({ m, x }) => ({ user_id: userId, module: m, can_view: !!x.view, can_create: !!x.create, can_edit: !!x.edit, can_delete: !!x.delete }))
  if (!rows.length) return null
  const { error } = await supabase.from('user_permissions').insert(rows)
  return error
}

export default function Equipe() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'new' | 'edit' | 'perms'
  const [form, setForm] = useState(EMPTY)
  const [perms, setPerms] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    if (DEMO) {
      setUsers((await listTeam()).map((u) => ({ ...u, email: '—', status: 'ativo' })))
    } else {
      const { data } = await supabase.from('profiles').select('*').order('full_name')
      setUsers(data || [])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const open = (kind, u) => {
    setMsg('')
    setForm(u ? { id: u.id, name: u.full_name, email: u.email, role: u.role, status: u.status, password: '' } : EMPTY)
    setModal(kind)
  }

  const openPerms = async (u) => {
    open('perms', u)
    const { data } = await supabase.from('user_permissions').select('*').eq('user_id', u.id)
    const map = {}
    ;(data || []).forEach((x) => { map[x.module] = { view: x.can_view, create: x.can_create, edit: x.can_edit, delete: x.can_delete } })
    setPerms(map)
  }

  const create = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    const res = await supabase.functions.invoke('admin-create-user', {
      body: { name: form.name, email: form.email, role: form.role, password: form.password },
    })
    if (res.error || res.data?.error) {
      setMsg(res.data?.error || (await fnError(res)))
    } else {
      // Já libera o acesso padrão do perfil; o administrador ajusta depois, se quiser.
      if (res.data?.user_id && ROLE_PRESETS[form.role]) await savePermissions(res.data.user_id, ROLE_PRESETS[form.role])
      await load()
      setModal(null)
    }
    setBusy(false)
  }

  const update = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    const { error } = await supabase.from('profiles')
      .update({ full_name: form.name, role: form.role, status: form.status, updated_at: new Date().toISOString() })
      .eq('id', form.id)
    if (error) setMsg('Não foi possível salvar as alterações.')
    else { await load(); setModal(null) }
    setBusy(false)
  }

  const toggleStatus = async (u) => {
    await supabase.from('profiles').update({ status: u.status === 'ativo' ? 'inativo' : 'ativo', updated_at: new Date().toISOString() }).eq('id', u.id)
    load()
  }

  const savePerms = async () => {
    setBusy(true); setMsg('')
    const error = await savePermissions(form.id, perms)
    if (error) setMsg('Não foi possível salvar as permissões.')
    else setModal(null)
    setBusy(false)
  }

  const toggle = (m, a, v) => setPerms((p) => ({ ...p, [m]: { ...(p[m] || {}), [a]: v } }))

  return (
    <section>
      {DEMO && (
        <div className="notice" role="status">
          Modo demonstração: a gestão de usuários fica disponível quando o Revela estiver conectado ao Supabase.
        </div>
      )}
      <div className="toolbar">
        <span className="count">{users.length} pessoa(s)</span>
        {!DEMO && (
          <button type="button" className="btn primary" onClick={() => open('new')}>
            <Icon name="plus" size={16} /> Novo usuário
          </button>
        )}
      </div>

      <div className="tableWrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Nome</th><th scope="col">Perfil</th><th scope="col">Status</th><th scope="col">Cadastro</th>
              <th scope="col" className="actionsHead"><span className="srOnly">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="emptyState" colSpan={5}>Carregando…</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id}>
                <td data-label="Nome" className="primaryCell">{u.full_name}<small className="subline">{u.email}</small></td>
                <td data-label="Perfil"><span className="rolePill">{ROLES[u.role] || u.role}</span></td>
                <td data-label="Status">{u.status === 'ativo' ? 'Ativo' : 'Inativo'}</td>
                <td data-label="Cadastro" className="mono">{u.created_at ? fmtDate(u.created_at) : '—'}</td>
                <td className="actionsCell">
                  {!DEMO && (
                    <>
                      <button type="button" className="iconBtn" title="Permissões" aria-label="Permissões" onClick={() => openPerms(u)}><Icon name="key" size={16} /></button>
                      <button type="button" className="iconBtn" title="Editar" aria-label="Editar" onClick={() => open('edit', u)}><Icon name="edit" size={16} /></button>
                      <button type="button" className="btn link" onClick={() => toggleStatus(u)}>{u.status === 'ativo' ? 'Inativar' : 'Ativar'}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === 'new' || modal === 'edit') && (
        <Modal title={modal === 'new' ? 'Novo usuário' : 'Editar usuário'} subtitle={modal === 'edit' ? form.email : 'O acesso é criado pelo administrador.'} onClose={() => setModal(null)}>
          <form className="form" onSubmit={modal === 'new' ? create : update}>
            <label className="field full"><span>Nome completo *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            {modal === 'new' && <label className="field full"><span>E-mail *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>}
            {modal === 'new' && <label className="field full"><span>Senha inicial *</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required placeholder="Mínimo de 8 caracteres" autoComplete="new-password" /></label>}
            <label className="field"><span>Perfil</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            {modal === 'edit' && (
              <label className="field"><span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                </select>
              </label>
            )}
            {msg && <div className="notice warn full" role="alert">{msg}</div>}
            <div className="formActions full">
              <button type="button" className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'perms' && (
        <Modal wide title="Permissões" subtitle={`${form.name} · acesso por módulo`} onClose={() => setModal(null)}>
          <div className="permGrid" role="group" aria-label="Permissões por módulo">
            <div className="permRow permHead"><span>Módulo</span>{ACTIONS.map(([k, l]) => <span key={k}>{l}</span>)}</div>
            {MODULES.map(([m, label]) => (
              <div className="permRow" key={m}>
                <b>{label}</b>
                {ACTIONS.map(([k, l]) => (
                  <label key={k}>
                    <input type="checkbox" aria-label={`${label}: ${l}`} checked={!!perms[m]?.[k]} onChange={(e) => toggle(m, k, e.target.checked)} />
                  </label>
                ))}
              </div>
            ))}
          </div>
          {msg && <div className="notice warn" role="alert">{msg}</div>}
          <div className="formActions">
            {ROLE_PRESETS[form.role] && (
              <button type="button" className="btn secondary" onClick={() => setPerms(ROLE_PRESETS[form.role])}>
                Aplicar padrão de {ROLES[form.role]}
              </button>
            )}
            <button type="button" className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
            <button type="button" className="btn primary" disabled={busy} onClick={savePerms}>{busy ? 'Salvando…' : 'Salvar permissões'}</button>
          </div>
        </Modal>
      )}
    </section>
  )
}
