// api/admin/user-lookup.js
// Protected admin endpoint for looking up users by email

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

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query param required' });

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, role, avatar_url')
      .ilike('email', `%${email.trim()}%`)
      .limit(10);

    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[admin/user-lookup]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
