import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as variáveis de ambiente, o Revela abre em modo demonstração
// (dados de exemplo guardados só neste navegador).
export const supabase = url && key ? createClient(url, key) : null
export const DEMO = !supabase
