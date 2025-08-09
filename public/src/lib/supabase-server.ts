import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  assertEnv,
} from './config';

assertEnv();

export function supabaseServer() {
  // default server client with anon key (safe for SSR fetching with RLS)
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function supabaseAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required server-side');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
