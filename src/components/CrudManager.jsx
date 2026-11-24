import { useCallback, useEffect, useMemo, useState } from 'react'
import { listRows, saveRow, deleteRow, listTeam } from '../lib/data.js'
import { Chip, Icon, Modal } from './ui.jsx'
import { TONE } from '../lib/schema.js'
import {
  fmtDate, fmtDateTime, fmtMoney, toLocalInput, fromLocalInput, prazoSituacao, friendlyError,
} from '../lib/format.js'

const INPUT_TYPE = { text: 'text', email: 'email', tel: 'tel', number: 'number', date: 'date', datetime: 'datetime-local' }

// Tela de cadastro genérica, dirigida por uma configuração (veja src/modules/configs.js).
export default function CrudManager({ cfg, perms }) {
  const [rows, setRows] = useState([])
  const [refs, setRefs] = useState({})
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageMsg, setPageMsg] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(() => Object.fromEntries((cfg.filters || []).map((f) => [f.id, f.default])))
  const [modal, setModal] = useState(null) // 'new' | 'edit' | null
  const [form, setForm] = useState({})
  const [formMsg, setFormMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const refTables = useMemo(
    () => [...new Set(cfg.fields.filter((f) => f.kind === 'ref').map((f) => f.ref.table))],
    [cfg],
  )
  const needsTeam = cfg.fields.some((f) => f.kind === 'team') || cfg.columns.some((c) => c.kind === 'team')

  const load = useCallback(async () => {
    setLoading(true)
    setPageMsg('')
    try {
      const [main, refList, teamList] = await Promise.all([
        listRows(cfg.table),
        Promise.all(refTables.map((t) => listRows(t).catch(() => []))),
        needsTeam ? listTeam().catch(() => []) : Promise.resolve([]),
      ])
      setRows(main)
      setRefs(Object.fromEntries(refTables.map((t, i) => [t, refList[i]])))
      setTeam(teamList)
    } catch (e) {
      setRows([])
      setPageMsg(friendlyError(e))
    }
    setLoading(false)
  }, [cfg, refTables, needsTeam])

  useEffect(() => { load() }, [load])

  const refLabel = (ref, id) => {
    const r = (refs[ref.table] || []).find((x) => x.id === id)
    return r ? r[ref.label] : '—'
  }
  const teamName = (id) => team.find((x) => x.id === id)?.full_name || '—'

  const cell = (col, row) => {
    const v = row[col.key]
    switch (col.kind) {
      case 'date': return fmtDate(v)
      case 'datetime': return fmtDateTime(v)
      case 'money': return fmtMoney(v)
      case 'map': return v ? col.map[v] || v : '—'
      case 'chip': return v ? <Chip tone={TONE[v] || 'neutral'}>{col.map[v] || v}</Chip> : '—'
      case 'ref': return v ? refLabel(col.ref, v) : '—'
      case 'team': return v ? teamName(v) : '—'
      case 'situacao': { const s = prazoSituacao(row); return <Chip tone={s.tone}>{s.label}</Chip> }
      default: return v === null || v === undefined || v === '' ? '—' : String(v)
    }
  }

  const searchText = (row) =>
    cfg.fields.map((f) => {
      const v = row[f.key]
      if (v === null || v === undefined) return ''
      if (f.kind === 'ref') return refLabel(f.ref, v)
      if (f.kind === 'team') return teamName(v)
      if (f.kind === 'select') return f.options.find((o) => o[0] === v)?.[1] || v
      return String(v)
    }).join(' ') + ' ' + (row.numero || '')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => {
      for (const f of cfg.filters || []) {
        const val = filters[f.id]
        if (val && val !== 'todos' && !f.test(r, val)) return false
      }
      return !q || searchText(r).toLowerCase().includes(q)
    })
    return cfg.sort ? [...list].sort(cfg.sort) : list
  }, [rows, query, filters, refs, team]) // eslint-disable-line react-hooks/exhaustive-deps

  const blank = () =>
    Object.fromEntries(cfg.fields.map((f) => [f.key, typeof f.def === 'function' ? f.def() : f.def ?? '']))

  const openNew = () => { setForm(blank()); setFormMsg(''); setModal('new') }
  const openEdit = (r) => {
    const f = blank()
    cfg.fields.forEach((x) => {
      const v = r[x.key]
      f[x.key] = v === null || v === undefined ? '' : x.kind === 'datetime' ? toLocalInput(v) : String(v)
    })
    f.id = r.id
    f.numero = r.numero
    setForm(f); setFormMsg(''); setModal('edit')
  }

  // Ao trocar um campo, limpa os que dependem dele (ex.: trocar o cliente limpa o projeto).
  const setField = (key, val) =>
    setForm((p) => {
      const n = { ...p, [key]: val }
      cfg.fields.forEach((f) => { if (f.ref?.filterBy === key) n[f.key] = '' })
      return n
    })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFormMsg('')
    const payload = {}
    cfg.fields.forEach((f) => {
      let v = form[f.key]
      if (v === '' || v === undefined) v = null
      else if (f.kind === 'number') v = Number(v)
      else if (f.kind === 'datetime') v = fromLocalInput(v)
      payload[f.key] = v
    })
    try {
      await saveRow(cfg.table, modal === 'edit' ? form.id : null, payload)
      setModal(null)
      await load()
    } catch (err) {
      setFormMsg(friendlyError(err))
    }
    setBusy(false)
  }

  const remove = async (r) => {
    if (!window.confirm(`Excluir este registro (${cfg.singular})? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteRow(cfg.table, r.id)
      await load()
    } catch (err) {
      setPageMsg(friendlyError(err))
    }
  }

  const refOptions = (f) => {
    let list = refs[f.ref.table] || []
    const dep = f.ref.filterBy
    if (dep && form[dep]) list = list.filter((x) => !x[dep] || x[dep] === form[dep])
    return list
  }

  const renderField = (f) => {
    const common = {
      id: 'f_' + f.key, required: !!f.required, value: form[f.key] ?? '',
      onChange: (e) => setField(f.key, e.target.value),
    }
    let input
    if (f.kind === 'textarea') {
      input = <textarea rows={3} {...common} />
    } else if (f.kind === 'select') {
      input = (
        <select {...common}>
          {!f.required && <option value="">—</option>}
          {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      )
    } else if (f.kind === 'ref') {
      input = (
        <select {...common}>
          <option value="">{f.required ? 'Selecione…' : '—'}</option>
          {refOptions(f).map((o) => <option key={o.id} value={o.id}>{o[f.ref.label]}</option>)}
        </select>
      )
    } else if (f.kind === 'team') {
      input = (
        <select {...common}>
          <option value="">—</option>
          {team.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
        </select>
      )
    } else {
      input = (
        <input
          type={INPUT_TYPE[f.kind] || 'text'} className={f.mono ? 'mono' : undefined}
          step={f.kind === 'number' ? '0.01' : undefined} min={f.kind === 'number' ? '0' : undefined}
          placeholder={f.placeholder} {...common}
        />
      )
    }
    return (
      <label key={f.key} className={'field' + (f.full ? ' full' : '')} htmlFor={'f_' + f.key}>
        <span>{f.label}{f.required ? ' *' : ''}</span>
        {input}
        {f.hint && <small>{f.hint}</small>}
      </label>
    )
  }

  const ctx = { refs, team }
  const colCount = cfg.columns.length + 1

  return (
    <section>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${cfg.plural}…`} aria-label={`Buscar ${cfg.plural}`}
          />
        </div>
        {(cfg.filters || []).map((f) => (
          <select
            key={f.id} className="filterSelect" aria-label={f.label} value={filters[f.id]}
            onChange={(e) => setFilters((p) => ({ ...p, [f.id]: e.target.value }))}
          >
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <span className="count">{visible.length} de {rows.length}</span>
        {perms.create && (
          <button type="button" className="btn primary" onClick={openNew}>
            <Icon name="plus" size={16} /> {cfg.novo}
          </button>
        )}
      </div>

      {pageMsg && <div className="notice warn" role="alert">{pageMsg}</div>}

      <div className="tableWrap">
        <table className="tbl">
          <thead>
            <tr>
              {cfg.columns.map((c) => <th key={c.key + c.kind} scope="col">{c.label}</th>)}
              <th scope="col" className="actionsHead"><span className="srOnly">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="emptyState" colSpan={colCount}>Carregando…</td></tr>}
            {!loading && !visible.length && (
              <tr>
                <td className="emptyState" colSpan={colCount}>
                  {rows.length ? 'Nenhum resultado para esta busca ou filtro.' : `Nenhum registro ainda.`}
                  {!rows.length && perms.create && (
                    <> <button type="button" className="btn link" onClick={openNew}>{cfg.novo}</button></>
                  )}
                </td>
              </tr>
            )}
            {!loading && visible.map((r) => (
              <tr key={r.id}>
                {cfg.columns.map((c, i) => (
                  <td key={c.key + c.kind} data-label={c.label} className={(c.mono ? 'mono ' : '') + (i === 0 ? 'primaryCell' : '')}>
                    {cell(c, r)}
                  </td>
                ))}
                <td className="actionsCell">
                  {(cfg.actions || []).map((a) => (
                    <button key={a.label} type="button" className="iconBtn" title={a.label} aria-label={`${a.label}: ${r[cfg.columns[0].key] ?? ''}`} onClick={() => a.run(r, ctx)}>
                      <Icon name={a.icon} size={16} />
                    </button>
                  ))}
                  {perms.edit && (
                    <button type="button" className="iconBtn" title="Editar" aria-label="Editar" onClick={() => openEdit(r)}><Icon name="edit" size={16} /></button>
                  )}
                  {perms.delete && (
                    <button type="button" className="iconBtn" title="Excluir" aria-label="Excluir" onClick={() => remove(r)}><Icon name="trash" size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal === 'new' ? cfg.novo : `Editar ${cfg.singular}`}
          subtitle={modal === 'edit' && form.numero ? `Contrato ${form.numero}` : undefined}
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="form">
            {cfg.fields.map(renderField)}
            {formMsg && <div className="notice warn full" role="alert">{formMsg}</div>}
            <div className="formActions full">
              <button type="button" className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
