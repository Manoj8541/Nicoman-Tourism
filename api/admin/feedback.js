// api/admin/feedback.js
// Protected admin endpoint for feedback moderation.
// GET    /api/admin/feedback          → list ALL feedback (including hidden)
// PUT    /api/admin/feedback?id=...   → toggle hidden flag (soft-hide/unhide)
// DELETE /api/admin/feedback?id=...   → permanently delete

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { hidden } = req.body;
      const { data, error } = await supabaseAdmin
        .from('feedback')
        .update({ hidden: Boolean(hidden) })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabaseAdmin.from('feedback').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/feedback]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
