import { useEffect, useState } from 'react'
import { supabase, DEMO } from '../lib/supabase.js'
import { Mark } from './ui.jsx'

function BrandPanel() {
  return (
    <div className="loginBrand">
      <div className="loginBrandTop"><Mark size={30} /><span className="wordmark">Revela</span></div>
      <div className="loginBrandBody">
        <Mark size={96} title="Revela" />
        <h2>Prazos, contratos e clientes do seu estúdio, em um só lugar.</h2>
      </div>
      <p className="loginBrandFoot">Gestão para estúdios fotográficos</p>
    </div>
  )
}

export default function Login({ onDemo, authError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState('login')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setNotice(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError('E-mail ou senha inválidos.')
  }

  const recover = async (e) => {
    e.preventDefault()
    setError(''); setNotice('')
    if (!email.trim()) { setError('Informe o e-mail cadastrado para receber o link de recuperação.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?reset-password=1`,
    })
    setLoading(false)
    if (err) { setError('Não foi possível enviar o e-mail. Confira as URLs de redirecionamento no Supabase.'); return }
    setNotice('Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha. Veja também a caixa de spam.')
  }

  return (
    <div className="loginPage">
      <BrandPanel />
      <main className="loginPanel">
        <div className="loginForm">
          <div className="loginMobileBrand"><Mark size={26} /><span className="wordmark">Revela</span></div>
          {DEMO ? (
            <>
              <p className="eyebrow">MODO DEMONSTRAÇÃO</p>
              <h1>Conheça o Revela</h1>
              <p className="muted">
                Os dados de exemplo ficam salvos só neste navegador. Para usar de verdade, conecte o Supabase
                (veja o README) e entre com o e-mail e a senha da sua equipe.
              </p>
              <button type="button" className="btn primary block" onClick={onDemo}>Entrar na demonstração</button>
            </>
          ) : mode === 'login' ? (
            <form onSubmit={submit}>
              <p className="eyebrow">ACESSO PRIVADO</p>
              <h1>Entrar</h1>
              <p className="muted">Use o e-mail e a senha fornecidos pelo administrador do estúdio.</p>
              <label className="field"><span>E-mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="seu@email.com" />
              </label>
              <label className="field"><span>Senha</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </label>
              {(error || authError) && <div className="notice warn" role="alert">{error || authError}</div>}
              <button type="submit" className="btn primary block" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
              <button type="button" className="btn link" onClick={() => { setMode('recover'); setError(''); setNotice('') }}>Esqueci minha senha</button>
            </form>
          ) : (
            <form onSubmit={recover}>
              <p className="eyebrow">RECUPERAÇÃO</p>
              <h1>Recuperar senha</h1>
              <p className="muted">Informe o e-mail da sua conta para receber o link de recuperação.</p>
              <label className="field"><span>E-mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
              </label>
              {error && <div className="notice warn" role="alert">{error}</div>}
              {notice && <div className="notice" role="status">{notice}</div>}
              <button type="submit" className="btn primary block" disabled={loading}>{loading ? 'Enviando…' : 'Enviar link'}</button>
              <button type="button" className="btn link" onClick={() => { setMode('login'); setError(''); setNotice('') }}>Voltar para o login</button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

// Tela aberta pelo link do e-mail de recuperação (?reset-password=1).
export function ResetPassword({ onBack }) {
  const [state, setState] = useState('checking') // checking | ok | invalid
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) { setState('invalid'); return undefined }
    let alive = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && alive) setState('ok')
    })
    supabase.auth.getSession().then(({ data }) => { if (alive && data.session) setState('ok') })
    const t = setTimeout(() => { if (alive) setState((s) => (s === 'checking' ? 'invalid' : s)) }, 3000)
    return () => { alive = false; clearTimeout(t); subscription.unsubscribe() }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não conferem.'); return }
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) setError('Não foi possível redefinir a senha. Peça um novo link.')
    else setDone(true)
  }

  return (
    <div className="loginPage">
      <BrandPanel />
      <main className="loginPanel">
        <div className="loginForm">
          <p className="eyebrow">NOVA SENHA</p>
          <h1>Redefinir senha</h1>
          {state === 'checking' && <p className="muted">Validando o link…</p>}
          {state === 'invalid' && <div className="notice warn" role="alert">Link inválido ou expirado. Peça um novo link na tela de login.</div>}
          {state === 'ok' && !done && (
            <form onSubmit={submit}>
              <label className="field"><span>Nova senha</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" /></label>
              <label className="field"><span>Repita a senha</span><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required autoComplete="new-password" /></label>
              {error && <div className="notice warn" role="alert">{error}</div>}
              <button type="submit" className="btn primary block" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
            </form>
          )}
          {done && <div className="notice" role="status">Senha redefinida. Já pode entrar com a nova senha.</div>}
          <button type="button" className="btn link" onClick={onBack}>Voltar para o login</button>
        </div>
      </main>
    </div>
  )
}
