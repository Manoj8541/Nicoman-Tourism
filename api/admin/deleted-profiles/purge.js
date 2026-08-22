// api/admin/deleted-profiles/purge.js
// DELETE /api/admin/deleted-profiles/purge?id=... — Permanently wipe account and all traces

import { supabaseAdmin } from '../../_lib/supabase-admin.js';
import { requireAdmin } from '../../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabaseAdmin
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      const fallback = await supabaseAdmin
        .from('deleted_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      delProf = fallback.data;
    }

    const email = delProf?.email?.trim().toLowerCase();
    const targetUserId = id;

    // 1. Delete from deleted_profiles
    await supabaseAdmin.from('deleted_profiles').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('deleted_profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabaseAdmin.from('deleted_profiles').delete().eq('email', email);
    }

    // 2. Delete from profiles
    await supabaseAdmin.from('profiles').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabaseAdmin.from('profiles').delete().eq('email', email);
    }

    // 3. Delete traces across tables
    await supabaseAdmin.from('customer_queries').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('feedback').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('bookings').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('ferry_bookings').delete().eq('user_id', targetUserId);

    if (email) {
      await supabaseAdmin.from('customer_queries').delete().eq('email', email);
      await supabaseAdmin.from('feedback').delete().eq('email', email);
      await supabaseAdmin.from('bookings').delete().eq('email', email);
      await supabaseAdmin.from('ferry_bookings').delete().eq('email', email);
    }

    // 4. Delete user from auth.users
    try {
      await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Account ${email || targetUserId} and all traces permanently purged.`,
    });
  } catch (err) {
    console.error('[admin/deleted-profiles/purge]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
