# GoGoBubbles Dashboard (Vercel)

## Local dev
- npm install
- npm run dev

Set env in `.env.local`:
- VITE_SUPABASE_URL=
- VITE_SUPABASE_ANON_KEY=
- VITE_MAPBOX_TOKEN=
- VITE_STRIPE_PK=

## Deploy (Vercel)
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables (Project → Settings → Environment Variables):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_MAPBOX_TOKEN
  - VITE_STRIPE_PK

## Notes
- RLS and schema migrations live under `supabase/migrations/`; run in your Supabase project.
- Edge Functions stubs: `supabase/functions/admin_ops`.
- Do not commit secrets. Use Vercel Project Env.
