// api/user/avatar.js
// Serverless handler for user avatar removal with service role storage deletion.

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
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

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

    const avatarPath = profile?.avatar_path || (
      profile?.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );

    if (avatarPath) {
      try {
        await supabaseAdmin.storage.from('avatars').remove([avatarPath]);
        console.log(`[user/avatar] Deleted storage avatar: ${avatarPath}`);
      } catch (storageErr) {
        console.warn('[user/avatar] Storage removal warning:', storageErr.message);
      }
    }

    await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: null, avatar_path: null, updated_at: new Date().toISOString() })
      .eq(profile?.user_id ? 'user_id' : 'id', user.id);

    return res.status(200).json({ success: true, message: 'Avatar removed from storage' });
  } catch (err) {
    console.error('[user/avatar] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
