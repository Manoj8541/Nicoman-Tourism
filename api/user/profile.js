// api/user/profile.js
// Serverless handler for updating user profiles with service-role avatar storage cleanup.

import { supabaseAdmin } from '../_lib/supabase-admin.js';

async function cleanupStorageAvatar(avatarPathOrUrl) {
  if (!avatarPathOrUrl || typeof avatarPathOrUrl !== 'string') return;
  let path = avatarPathOrUrl;
  if (avatarPathOrUrl.includes('/storage/v1/object/public/avatars/')) {
    path = avatarPathOrUrl.split('/storage/v1/object/public/avatars/')[1]?.split('?')[0];
  } else if (avatarPathOrUrl.includes('/avatars/')) {
    path = avatarPathOrUrl.split('/avatars/')[1]?.split('?')[0];
  } else if (avatarPathOrUrl.startsWith('http')) {
    return;
  } else {
    path = avatarPathOrUrl.split('?')[0];
  }
  if (!path) return;
  try {
    await supabaseAdmin.storage.from('avatars').remove([path]);
    console.log(`[api/user/profile] Cleaned up storage avatar: ${path}`);
  } catch (err) {
    console.warn(`[api/user/profile] Storage cleanup warning for ${path}:`, err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { full_name, phone, avatar_url, avatar_path } = req.body;
    const updateData = { updated_at: new Date().toISOString() };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;

    // Clean up old storage avatar file if replaced or removed
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
      if (avatar_path !== undefined) updateData.avatar_path = avatar_path;

      const oldAvatar = profile.avatar_path || profile.avatar_url;
      const isChanged = (avatar_url !== profile.avatar_url);
      if (oldAvatar && isChanged) {
        await cleanupStorageAvatar(oldAvatar);
      }
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq(profile.user_id ? 'user_id' : 'id', user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true, profile: updated });
  } catch (err) {
    console.error('[api/user/profile] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
