// api/admin/alerts.js
// Protected admin CRUD for the alerts table.
// GET    /api/admin/alerts          → list ALL alerts (including inactive)
// POST   /api/admin/alerts          → create alert
// PUT    /api/admin/alerts?id=...   → update alert (toggle active, edit message)
// DELETE /api/admin/alerts?id=...   → delete alert

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  // CORS for Realtime — public GET (active alerts) doesn't need auth
  if (req.method === 'GET' && !req.headers.authorization) {
    // Public: only return active alerts
    const { data, error } = await supabaseAdmin
      .from('alerts')
      .select('id, title, message, type, active, created_at, expires_at')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // All mutating operations + admin listing require auth
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Admin GET: all alerts including inactive
      const { data, error } = await supabaseAdmin
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, message, type, active, expires_at } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: 'title and message are required' });
      }
      const { data, error } = await supabaseAdmin
        .from('alerts')
        .insert({ title, message, type: type || 'info', active: active !== false, expires_at })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { title, message, type, active, expires_at } = req.body;
      const { data, error } = await supabaseAdmin
        .from('alerts')
        .update({ title, message, type, active, expires_at })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabaseAdmin.from('alerts').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/alerts]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
