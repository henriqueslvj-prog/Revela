import { useEffect, useState } from 'react'
import { supabase, DEMO } from './supabase.js'

// Acesso do usuário: administrador ativo vê tudo; os demais seguem user_permissions.
export async function loadAccess(profile) {
  if (DEMO || profile.role === 'administrador') return { admin: true, map: null }
  const { data } = await supabase.from('user_permissions').select('*').eq('user_id', profile.id)
  const map = {}
  ;(data || []).forEach((x) => {
    map[x.module] = { view: x.can_view, create: x.can_create, edit: x.can_edit, delete: x.can_delete }
  })
  return { admin: false, map }
}

export const can = (access, module, action = 'view') =>
  !!access && (access.admin || !!access.map?.[module]?.[action])

// Tema claro/escuro, guardado no aparelho. Escuro é o padrão.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('revela_theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('revela_theme', theme) } catch { /* ignora */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F5F4F1' : '#0F1115')
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}
