import { useEffect, useState } from 'react'
import { supabase, DEMO } from './lib/supabase.js'
import { DEMO_PROFILE } from './lib/demo.js'
import { loadAccess, useTheme } from './lib/auth.js'
import Login, { ResetPassword } from './components/Login.jsx'
import App from './App.jsx'

export default function Root() {
  const [theme, toggleTheme] = useTheme()
  const [session, setSession] = useState(DEMO ? null : undefined) // undefined = verificando
  const [profile, setProfile] = useState(null)
  const [access, setAccess] = useState(null)
  const [authError, setAuthError] = useState('')
  const [resetRoute, setResetRoute] = useState(
    () => new URLSearchParams(window.location.search).get('reset-password') === '1',
  )

  const clear = () => { setSession(null); setProfile(null); setAccess(null) }

  // Confere se o usuário está ativo e carrega as permissões antes de mostrar o app.
  const applySession = async (s) => {
    if (!s) { clear(); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', s.user.id).single()
    if (error || !data || data.status !== 'ativo') {
      await supabase.auth.signOut()
      clear()
      setAuthError('Seu acesso não está ativo. Procure o administrador do Revela.')
      return
    }
    const acc = await loadAccess(data)
    setProfile(data); setAccess(acc); setSession(s); setAuthError('')
  }

  useEffect(() => {
    if (DEMO) return undefined
    supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // Chamadas ao Supabase dentro deste callback podem travar; por isso o setTimeout.
      if (event === 'SIGNED_OUT') setTimeout(() => applySession(null), 0)
      else if (event === 'SIGNED_IN') setTimeout(() => applySession(s), 0)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enterDemo = () => {
    setProfile(DEMO_PROFILE); setAccess({ admin: true, map: null }); setSession({ demo: true })
  }

  const logout = async () => {
    if (DEMO) { clear(); return }
    await supabase.auth.signOut()
  }

  const backToLogin = async () => {
    if (supabase) await supabase.auth.signOut()
    window.history.replaceState({}, document.title, window.location.pathname)
    setResetRoute(false)
    clear()
  }

  if (resetRoute) return <ResetPassword onBack={backToLogin} />
  if (session === undefined) return <div className="loading">Carregando Revela…</div>
  if (!session || !profile || !access) return <Login onDemo={enterDemo} authError={authError} />
  return <App profile={profile} access={access} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />
}
