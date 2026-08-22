// api/user/account.js
// Serverless handler for user self-deletion with storage cleanup.
// Verifies session token server-side, deletes avatar from storage, and deletes auth account.

import { supabaseAdmin } from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    // 1. Verify user identity via token
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // 2. Fetch user profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      profile = fallback.data;
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 3. Superadmin cannot self-delete
    if (profile.role === 'superadmin') {
      return res.status(403).json({
        error: 'Superadmin accounts cannot be self-deleted to protect system stability.'
      });
    }

    // 4. Delete avatar from storage
    const avatarPath = profile.avatar_path || (
      profile.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );

    if (avatarPath) {
      try {
        await supabaseAdmin.storage.from('avatars').remove([avatarPath]);
        console.log(`[delete-account] Removed storage avatar: ${avatarPath}`);
      } catch (storageErr) {
        console.warn('[delete-account] Non-fatal storage removal warning:', storageErr.message);
      }
    }

    // 5. Archive to deleted_profiles
    const scheduledPurge = new Date();
    scheduledPurge.setDate(scheduledPurge.getDate() + 30);

    const archivePayload = {
      user_id: user.id,
      email: profile.email || user.email,
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      avatar_url: profile.avatar_url,
      deleted_at: new Date().toISOString(),
      scheduled_purge_at: scheduledPurge.toISOString(),
      deletion_reason: req.body?.reason || 'User self-deletion via profile',
    };

    try {
      await supabaseAdmin
        .from('deleted_profiles')
        .upsert(archivePayload, { onConflict: 'user_id' });
    } catch (archErr) {
      console.warn('[delete-account] Archival note:', archErr.message);
    }

    // 6. Delete from public.profiles
    await supabaseAdmin.from('profiles').delete().eq('user_id', user.id);
    if (profile.email) {
      await supabaseAdmin.from('profiles').delete().eq('email', profile.email);
    }

    // 7. Delete auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      throw new Error(`Failed to delete user account: ${delErr.message}`);
    }

    // 8. Clean up user queries and feedback
    try {
      await supabaseAdmin.from('customer_queries').delete().eq('user_id', user.id);
      await supabaseAdmin.from('feedback').delete().eq('user_id', user.id);
    } catch (cleanErr) {
      console.warn('[delete-account] Trace cleanup note:', cleanErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted and archived for 30 days.',
      scheduled_purge_at: scheduledPurge.toISOString(),
    });
  } catch (err) {
    console.error('[delete-account] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
