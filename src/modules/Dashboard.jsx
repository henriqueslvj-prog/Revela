import { useEffect, useMemo, useState } from 'react'
import { listRows } from '../lib/data.js'
import { Chip } from '../components/ui.jsx'
import { L, TONE } from '../lib/schema.js'
import { daysUntil, fmtDate, fmtDateTime, fmtMoney, friendlyError, prazoSituacao } from '../lib/format.js'

const OPEN = (s) => !['concluido', 'cancelado'].includes(s)
// [tabela, módulo que dá acesso a ela]
const SOURCES = [['prazos', 'prazos'], ['contratos', 'contratos'], ['sessoes', 'agenda'], ['projetos', 'projetos'], ['clientes', 'clientes']]

function Stat({ label, value, sub, hot }) {
  return (
    <div className={'stat' + (hot ? ' hot' : '')}>
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      <div className="statSub">{sub}</div>
    </div>
  )
}

function Panel({ title, linkLabel, onLink, empty, children }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="panel">
      <div className="panelHead">
        <h2>{title}</h2>
        {onLink && <button type="button" className="link" onClick={onLink}>{linkLabel}</button>}
      </div>
      {hasRows ? children : <p className="muted">{empty}</p>}
    </div>
  )
}

export default function Dashboard({ can, onGo }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    const want = SOURCES.filter(([, m]) => can(m, 'view'))
    Promise.all(want.map(([t]) => listRows(t)))
      .then((res) => {
        if (!alive) return
        const o = { prazos: [], contratos: [], sessoes: [], projetos: [], clientes: [] }
        want.forEach(([t], i) => { o[t] = res[i] })
        setD(o)
      })
      .catch((e) => alive && setErr(friendlyError(e)))
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const m = useMemo(() => {
    if (!d) return null
    const abertos = d.prazos.filter((p) => OPEN(p.status))
    const atrasados = abertos.filter((p) => daysUntil(p.data_limite) < 0)
    const semana = abertos.filter((p) => { const n = daysUntil(p.data_limite); return n >= 0 && n <= 7 })
    const aguardando = d.contratos.filter((c) => c.status === 'enviado')
    const rascunhos = d.contratos.filter((c) => c.status === 'rascunho')
    const prox = d.sessoes
      .filter((s) => s.status === 'agendada' && daysUntil(s.inicio) >= 0)
      .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)))
    const sessoesSemana = prox.filter((s) => daysUntil(s.inicio) <= 7)
    return {
      abertos, atrasados, semana, aguardando, rascunhos, prox, sessoesSemana,
      listaPrazos: [...abertos].sort((a, b) => String(a.data_limite).localeCompare(String(b.data_limite))).slice(0, 6),
      listaContratos: [...aguardando, ...rascunhos].slice(0, 6),
    }
  }, [d])

  if (err) return <div className="notice warn" role="alert">{err}</div>
  if (!d || !m) return <p className="muted">Carregando…</p>

  const projTitle = (id) => d.projetos.find((p) => p.id === id)?.titulo || 'Sem projeto'
  const cliNome = (id) => d.clientes.find((c) => c.id === id)?.nome || '—'
  const dash = (mod, v) => (can(mod, 'view') ? v : '—')

  return (
    <div className="dash">
      <div className="cards">
        <Stat label="Prazos nos próximos 7 dias" value={dash('prazos', m.semana.length)} sub={`${m.abertos.length} em aberto no total`} />
        <Stat label="Contratos aguardando assinatura" value={dash('contratos', m.aguardando.length)} sub={`${m.rascunhos.length} em rascunho`} />
        <Stat label="Sessões nos próximos 7 dias" value={dash('agenda', m.sessoesSemana.length)} sub={m.prox[0] ? `Próxima: ${fmtDateTime(m.prox[0].inicio)}` : 'Nenhuma agendada'} />
        <Stat label="Prazos atrasados" value={dash('prazos', m.atrasados.length)} sub={m.atrasados.length ? 'Requer atenção' : 'Tudo em dia'} hot={m.atrasados.length > 0} />
      </div>

      <div className="grid3">
        {can('prazos', 'view') && (
          <Panel title="Próximos prazos" linkLabel="Ver todos" onLink={() => onGo('prazos')} empty="Nenhum prazo em aberto.">
            {m.listaPrazos.map((p) => {
              const s = prazoSituacao(p)
              return (
                <div className="rowItem" key={p.id}>
                  <div className="rowMain">
                    <div className="rowTitle">{p.titulo}</div>
                    <div className="rowSub">{projTitle(p.projeto_id)} · {L.etapa[p.etapa] || p.etapa}</div>
                  </div>
                  <div className="mono rowRight">{fmtDate(p.data_limite)}</div>
                  <Chip tone={s.tone}>{s.label}</Chip>
                </div>
              )
            })}
          </Panel>
        )}

        {can('contratos', 'view') && (
          <Panel title="Contratos pendentes" linkLabel="Ver todos" onLink={() => onGo('contratos')} empty="Nenhum contrato pendente.">
            {m.listaContratos.map((c) => (
              <div className="rowItem" key={c.id}>
                <div className="rowMain">
                  <div className="rowTitle"><span className="mono">{c.numero}</span> · {cliNome(c.cliente_id)}</div>
                  <div className="rowSub">{projTitle(c.projeto_id)}</div>
                </div>
                <div className="mono rowRight">{fmtMoney(c.valor)}</div>
                <Chip tone={TONE[c.status] || 'neutral'}>{L.contratoStatus[c.status]}</Chip>
              </div>
            ))}
          </Panel>
        )}

        {can('agenda', 'view') && (
          <Panel title="Próximas sessões" linkLabel="Ver agenda" onLink={() => onGo('agenda')} empty="Nenhuma sessão agendada.">
            {m.prox.slice(0, 5).map((s) => (
              <div className="rowItem" key={s.id}>
                <div className="rowMain">
                  <div className="rowTitle">{s.titulo}</div>
                  <div className="rowSub">{s.local || 'Local a definir'}</div>
                </div>
                <div className="mono rowRight">{fmtDateTime(s.inicio)}</div>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  )
}
