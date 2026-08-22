// api/_lib/supabase-admin.js
// Server-side Supabase client using the SERVICE ROLE key.
// Used by API functions that need to bypass RLS (e.g. inserting bookings on behalf of users).
// NEVER expose this key to the client.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[Supabase Admin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'API functions that need admin access will fall back to stub data.'
  );
}

// Admin client — bypasses RLS
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  { auth: { persistSession: false } }
);

// Anon client for server-side use (respects RLS, used when we want RLS enforcement)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
export const supabaseAnon = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { persistSession: false } }
);

// Helper: create a client scoped to a user's JWT (for RLS-aware queries)
export function supabaseForUser(authHeader) {
  if (!authHeader) return supabaseAnon;
  const token = authHeader.replace('Bearer ', '');
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}
