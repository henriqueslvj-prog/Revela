import { useEffect, useMemo, useState } from 'react'
import { DEMO } from './lib/supabase.js'
import { resetDemo } from './lib/data.js'
import { can } from './lib/auth.js'
import { Icon, Mark } from './components/ui.jsx'
import CrudManager from './components/CrudManager.jsx'
import Dashboard from './modules/Dashboard.jsx'
import Equipe from './modules/Equipe.jsx'
import { CFG } from './modules/configs.js'
import { NAV, PAGE_INFO, ROLES } from './lib/schema.js'
import { longToday } from './lib/format.js'

const BOTTOM = ['dashboard', 'projetos', 'prazos', 'agenda']

export default function App({ profile, access, theme, onToggleTheme, onLogout }) {
  const canDo = (m, a = 'view') => can(access, m, a)
  const isAdmin = profile.role === 'administrador'

  const groups = useMemo(
    () => NAV.map((g) => ({ ...g, items: g.items.filter(([id]) => canDo(id, 'view')) })).filter((g) => g.items.length),
    [access], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const allowed = [...groups.flatMap((g) => g.items.map((i) => i[0])), ...(isAdmin ? ['equipe'] : [])]
  const labelOf = (id) => (id === 'equipe' ? 'Equipe' : NAV.flatMap((g) => g.items).find((i) => i[0] === id)?.[1] || id)

  const [page, setPage] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('page')
      if (allowed.includes(p)) return p
    } catch { /* ignora */ }
    return allowed[0] || null
  })
  const [menu, setMenu] = useState(false)

  const go = (id) => {
    setPage(id)
    setMenu(false)
    try { window.history.replaceState({}, '', `?page=${id}`) } catch { /* ignora */ }
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (!menu) return undefined
    const onEsc = (e) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [menu])

  const displayName = profile.full_name || profile.email || 'Usuário'
  const initials = (displayName[0] || 'R').toUpperCase()
  const [eyebrow, desc] = PAGE_INFO[page] || ['', '']
  const bottom = BOTTOM.filter((id) => allowed.includes(id))

  // Função (não componente) para os botões não serem recriados a cada render e perderem o foco.
  const navButton = (id) => (
    <button key={id} type="button" className={'navItem' + (page === id ? ' active' : '')} onClick={() => go(id)} aria-current={page === id ? 'page' : undefined}>
      <Icon name={id} size={18} /><span>{labelOf(id)}</span>
    </button>
  )

  return (
    <div className="app">
      <aside className={'sidebar' + (menu ? ' open' : '')} aria-label="Menu principal">
        <div className="sideHead">
          <div className="brand"><Mark size={28} /><span className="wordmark">Revela</span></div>
          <button type="button" className="iconBtn sideClose" onClick={() => setMenu(false)} aria-label="Fechar menu"><Icon name="close" size={20} /></button>
        </div>
        <nav>
          {groups.map((g) => (
            <div className="navGroup" key={g.group}>
              <span className="navLabel">{g.group}</span>
              {g.items.map(([id]) => navButton(id))}
            </div>
          ))}
          {isAdmin && (
            <div className="navGroup">
              <span className="navLabel">Administração</span>
              {navButton('equipe')}
            </div>
          )}
        </nav>
        <div className="sideFoot">
          <div className="profile">
            <div className="avatar" aria-hidden="true">{initials}</div>
            <div><b>{displayName}</b><small>{ROLES[profile.role] || profile.role}</small></div>
          </div>
          {DEMO && (
            <button type="button" className="navItem" onClick={() => { if (window.confirm('Restaurar os dados de exemplo? Suas alterações na demonstração serão perdidas.')) { resetDemo(); window.location.reload() } }}>
              <Icon name="refresh" size={18} /><span>Restaurar exemplos</span>
            </button>
          )}
          <button type="button" className="navItem" onClick={onLogout}><Icon name="logout" size={18} /><span>Sair</span></button>
        </div>
      </aside>
      {menu && <div className="overlay" onClick={() => setMenu(false)} />}

      <div className="appBody">
        <header className="topbar">
          <button type="button" className="iconBtn menuBtn" onClick={() => setMenu(true)} aria-label="Abrir menu"><Icon name="menu" size={20} /></button>
          <div className="crumb"><span>{eyebrow}</span><i>/</i><b>{labelOf(page)}</b></div>
          <div className="topActions">
            {DEMO && <span className="demoTag" title="Os dados ficam só neste navegador.">Demonstração</span>}
            <button type="button" className="iconBtn" onClick={onToggleTheme} title={theme === 'light' ? 'Tema escuro' : 'Tema claro'} aria-label="Alternar tema">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            </button>
            <div className="avatar" aria-hidden="true">{initials}</div>
          </div>
        </header>

        <main className="main">
          {!page && (
            <div className="notice warn" role="status">
              Seu perfil ainda não tem acesso a nenhum módulo. Fale com o administrador do estúdio.
            </div>
          )}
          {page && (
            <div className="heading">
              <div>
                <p className="eyebrow">{page === 'dashboard' ? longToday().toUpperCase() : eyebrow.toUpperCase()}</p>
                <h1>{page === 'dashboard' ? 'Painel do estúdio' : labelOf(page)}</h1>
                <p className="muted">{desc}</p>
              </div>
            </div>
          )}
          {page === 'dashboard' && <Dashboard can={canDo} onGo={go} />}
          {page === 'equipe' && <Equipe />}
          {CFG[page] && (
            <CrudManager
              key={page} cfg={CFG[page]}
              perms={{ create: canDo(page, 'create'), edit: canDo(page, 'edit'), delete: canDo(page, 'delete') }}
            />
          )}
        </main>
      </div>

      <nav className="bottomNav" aria-label="Navegação rápida">
        {bottom.map((id) => (
          <button key={id} type="button" className={page === id ? 'active' : ''} onClick={() => go(id)} aria-current={page === id ? 'page' : undefined}>
            <Icon name={id} size={21} /><span>{labelOf(id)}</span>
          </button>
        ))}
        <button type="button" className={menu ? 'active' : ''} onClick={() => setMenu(true)}><Icon name="menu" size={21} /><span>Mais</span></button>
      </nav>
    </div>
  )
}
