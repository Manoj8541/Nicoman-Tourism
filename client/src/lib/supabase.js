// client/src/lib/supabase.js
// Supabase client initialization — uses the anon key (safe for frontend).
// The anon key is safe to expose: all actual permission enforcement happens
// via Postgres Row Level Security (RLS) policies in the database, not here.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Auth and database features will not work. ' +
    'Copy client/.env.example to client/.env and fill in your Supabase project credentials.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
