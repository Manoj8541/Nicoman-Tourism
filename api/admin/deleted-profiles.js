// api/admin/deleted-profiles.js
// GET /api/admin/deleted-profiles — List all accounts archived in 30-day recovery vault

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('deleted_profiles')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(r => ({
      id: r.user_id,
      user_id: r.user_id,
      email: r.email,
      full_name: r.full_name,
      phone: r.phone,
      role: r.role,
      avatar_url: r.avatar_url,
      deleted_at: r.deleted_at,
      scheduled_purge_at: r.scheduled_purge_at,
      deletion_reason: r.deletion_reason || 'User self-deletion via profile',
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    console.error('[admin/deleted-profiles]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
