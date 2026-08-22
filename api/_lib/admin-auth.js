// api/_lib/admin-auth.js
// Shared auth helpers for admin-protected API routes.
// Used by all api/admin/*.js endpoints.

import { supabaseAdmin } from './supabase-admin.js';

/**
 * Internal: decode JWT and fetch role from profiles table.
 * Returns { userId, email, role } or throws { status, message }.
 */
async function getCallerRole(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    throw { status: 401, message: 'Invalid or expired token' };
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    throw { status: 403, message: 'User profile not found' };
  }

  return { userId: user.id, email: user.email, role: profile.role };
}

/**
 * Allows admin AND superadmin (superadmin has all admin powers).
 * Returns { userId, email, role } on success.
 */
export async function requireAdmin(req) {
  const caller = await getCallerRole(req);
  if (caller.role !== 'admin' && caller.role !== 'superadmin' && caller.role !== 'demo_admin') {
    throw { status: 403, message: 'Forbidden: admin access required' };
  }

  // Block Demo Admin from mutating production data
  if (caller.role === 'demo_admin' && req.method !== 'GET') {
    const url = req.url || '';
    const isAllowedDemoAction = url.includes('/deleted-profiles/restore') ||
                                url.includes('/deleted-profiles/purge');
    if (!isAllowedDemoAction) {
      throw { status: 403, message: 'Demo Admin mode is read-only. Data modifications are disabled in demo mode.' };
    }
  }

  return caller;
}

/**
 * Allows ONLY superadmin.
 * Returns { userId, email, role } on success.
 */
export async function requireSuperAdmin(req) {
  const caller = await getCallerRole(req);
  if (caller.role !== 'superadmin') {
    throw { status: 403, message: 'Forbidden: superadmin access required' };
  }
  return caller;
}
