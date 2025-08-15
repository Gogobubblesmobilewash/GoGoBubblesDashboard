import { createClient } from '@supabase/supabase-js'

const devUrl = 'https://hombfzdgmtbbaahglclv.supabase.co'
const devAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbWJmemRnbXRiYmFhaGdsY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NTk5MzcsImV4cCI6MjA2NzIzNTkzN30.j9fdl-oYCYUbRigNFmzriKKrFNZTqG5h9hPXdJmbRWQ'

const fromEnvUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const fromEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isProd = import.meta.env.PROD
const supabaseUrl = isProd ? (fromEnvUrl ?? '') : (fromEnvUrl || devUrl)
const supabaseAnonKey = isProd ? (fromEnvKey ?? '') : (fromEnvKey || devAnon)

if (isProd && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Supabase env vars missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


