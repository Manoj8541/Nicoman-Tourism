// api/user/bookings/cancel.js
// POST /api/user/bookings/cancel — Cancel authenticated user's hotel booking

import { supabaseAdmin } from '../../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing booking ID' });

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, booking: data });
  } catch (err) {
    console.error('[user/bookings/cancel]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
