// api/admin/manage-admins.js
// Superadmin-only endpoint for managing admin accounts.
// GET    /api/admin/manage-admins          → list all admin-role users
// POST   /api/admin/manage-admins          → promote user by email to admin
// DELETE /api/admin/manage-admins?id=...   → demote admin back to user

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireSuperAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireSuperAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // List all users with role 'admin' (not superadmin — protect superadmin account)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email is required' });

      // Find the user by email
      const { data: profile, error: findErr } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('email', email.toLowerCase())
        .single();

      if (findErr || !profile) {
        return res.status(404).json({ error: 'User not found. They must sign up first.' });
      }
      if (profile.role === 'superadmin') {
        return res.status(400).json({ error: 'Cannot change a superadmin role.' });
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id)
        .select('id, email, full_name, role')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      // Safety: never demote a superadmin
      const { data: check } = await supabaseAdmin
        .from('profiles').select('role').eq('id', id).single();
      if (check?.role === 'superadmin') {
        return res.status(400).json({ error: 'Cannot demote a superadmin.' });
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', id)
        .select('id, email, full_name, role')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/manage-admins]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
