// api/user/sync-profile.js
// Sync / auto-create user profile for OAuth & new sign-ins

import { supabaseAdmin } from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || meta.given_name || user.email?.split('@')[0] || 'Traveller';
    const avatarUrl = meta.avatar_url || meta.picture || null;
    const email = user.email?.trim().toLowerCase();

    // Check if archived in deleted_profiles
    let archivedProfile = null;
    if (email) {
      const { data: delRow } = await supabaseAdmin
        .from('deleted_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      archivedProfile = delRow;
      if (delRow) {
        await supabaseAdmin.from('deleted_profiles').delete().eq('email', email);
      }
    }

    let { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing && email) {
      const fallbackEmail = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existing = fallbackEmail.data;
    }

    const profileData = {
      user_id: user.id,
      email: user.email,
      full_name: existing?.full_name || archivedProfile?.full_name || fullName,
      phone: existing?.phone || archivedProfile?.phone || null,
      avatar_url: existing?.avatar_url || archivedProfile?.avatar_url || avatarUrl,
      role: existing?.role || archivedProfile?.role || 'user',
      updated_at: new Date().toISOString(),
    };
    if (!existing) {
      profileData.created_at = archivedProfile?.created_at || new Date().toISOString();
    }

    let savedProfile = null;
    let saveErr = null;

    if (existing) {
      const resUpdate = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq(existing.user_id ? 'user_id' : 'id', user.id)
        .select()
        .single();
      savedProfile = resUpdate.data;
      saveErr = resUpdate.error;
    } else {
      const resInsert = await supabaseAdmin
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      savedProfile = resInsert.data;
      saveErr = resInsert.error;
    }

    if (saveErr) throw saveErr;

    return res.status(200).json({ success: true, profile: savedProfile });
  } catch (err) {
    console.error('[user/sync-profile]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
