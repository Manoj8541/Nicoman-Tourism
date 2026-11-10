import express from 'express';
import { supabase } from '../lib/supabase.js';
import { cleanupStorageImage } from '../middleware/auth.js';

const router = express.Router();

// ── Sync / Create User Profile (Google OAuth & new sign-ins) ──────────────────
router.post('/sync-profile', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || meta.given_name || user.email?.split('@')[0] || 'Traveller';
    const avatarUrl = meta.avatar_url || meta.picture || null;
    const email = user.email?.trim().toLowerCase();

    // If an archived profile exists in deleted_profiles for this user/email, auto-unarchive and clean it up!
    let archivedProfile = null;
    if (email) {
      const { data: delRow } = await supabase
        .from('deleted_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      archivedProfile = delRow;
      if (delRow) {
        await supabase.from('deleted_profiles').delete().eq('email', email);
      }
    }

    let { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing && email) {
      const fallbackEmail = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existing = fallbackEmail.data;
    }

    if (!existing) {
      const fallback = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      existing = fallback.data;
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
      const resUpdate = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', existing.user_id || user.id)
        .select()
        .single();
      savedProfile = resUpdate.data;
      saveErr = resUpdate.error;
    } else {
      const resInsert = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      savedProfile = resInsert.data;
      saveErr = resInsert.error;
    }

    if (saveErr) {
      console.error('[sync-profile] Profile error:', saveErr.message);
      return res.status(500).json({ error: saveErr.message });
    }

    res.json({ success: true, profile: savedProfile });
  } catch (err) {
    console.error('[sync-profile] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Update User Profile (with Service-Role Avatar Storage Cleanup) ─────────────
router.put('/profile', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = fallback.data;
    }

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (profile.role === 'demo_admin') {
      return res.status(403).json({ error: 'Demo Admin profile is locked. Profile modifications are disabled in demo mode.' });
    }

    const { full_name, phone, avatar_url, avatar_path } = req.body;
    const updateData = { updated_at: new Date().toISOString() };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
      if (avatar_path !== undefined) updateData.avatar_path = avatar_path;

      const oldAvatar = profile.avatar_path || profile.avatar_url;
      const isChanged = (avatar_url !== profile.avatar_url);
      if (oldAvatar && isChanged) {
        await cleanupStorageImage(oldAvatar, 'avatars');
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update(updateData)
      .eq(profile.user_id ? 'user_id' : 'id', user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('[update-profile] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── User Avatar Deletion (Service Role) ───────────────────────────────────────
router.delete('/avatar', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = fallback.data;
    }

    if (profile?.role === 'demo_admin') {
      return res.status(403).json({ error: 'Demo Admin profile is locked. Photo deletion is disabled in demo mode.' });
    }

    const avatarPath = profile?.avatar_path || (
      profile?.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );

    if (avatarPath) {
      await supabase.storage.from('avatars').remove([avatarPath]);
      console.log(`[user/avatar] Removed ${avatarPath} from avatars bucket`);
    }

    await supabase
      .from('profiles')
      .update({ avatar_url: null, avatar_path: null, updated_at: new Date().toISOString() })
      .eq(profile?.user_id ? 'user_id' : 'id', user.id);

    res.json({ success: true, message: 'Avatar removed from storage' });
  } catch (err) {
    console.error('[user/avatar] Deletion error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── User Account Self-Deletion & Archival ─────────────────────────────────────
router.delete('/account', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    let { data: profile, error: profErr } = await supabase
      .from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (profile.role === 'superadmin' || profile.role === 'demo_admin') {
      return res.status(403).json({
        error: profile.role === 'demo_admin'
          ? 'Demo Admin accounts are protected and cannot be deleted in public preview.'
          : 'Superadmin accounts cannot be self-deleted to protect system stability.'
      });
    }

    const { reason, turnstileToken } = req.body || {};

    if (turnstileToken && process.env.TURNSTILE_SECRET_KEY) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) return res.status(400).json({ error: 'Security verification failed' });
      } catch (tErr) {
        console.warn('[user-account] Turnstile verification error:', tErr.message);
      }
    }

    const avatarPath = profile.avatar_path || (
      profile.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );
    if (avatarPath) {
      try {
        await supabase.storage.from('avatars').remove([avatarPath]);
        console.log(`[user-account] Cleaned up avatar storage file: ${avatarPath}`);
      } catch (storageErr) {
        console.warn('[user-account] Storage avatar cleanup note:', storageErr.message);
      }
    }

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
      deletion_reason: reason || 'User self-deletion via profile',
    };

    let { error: archiveErr } = await supabase
      .from('deleted_profiles')
      .upsert(archivePayload, { onConflict: 'user_id' });

    if (archiveErr) {
      console.warn('[user-account] Archival warning:', archiveErr.message);
    }

    await supabase.from('profiles').delete().eq('user_id', user.id);
    if (profile.email) {
      await supabase.from('profiles').delete().eq('email', profile.email);
    }

    try {
      await supabase.auth.admin.deleteUser(user.id);
    } catch (authErr) {
      console.warn('[user-account] deleteUser note:', authErr.message);
    }

    try {
      await supabase.from('customer_queries').delete().eq('user_id', user.id);
      await supabase.from('feedback').delete().eq('user_id', user.id);
      if (user.email) {
        await supabase.from('customer_queries').delete().eq('email', user.email);
        await supabase.from('feedback').delete().eq('email', user.email);
      }
    } catch (cleanErr) {
      console.warn('[user-account] Trace cleanup error:', cleanErr.message);
    }

    res.json({
      success: true,
      message: 'Account deleted and archived for 30 days.',
      scheduled_purge_at: scheduledPurge.toISOString(),
    });
  } catch (err) {
    console.error('[user-account] Deletion error:', err.message);
    res.status(500).json({ error: 'Failed to delete account: ' + err.message });
  }
});

export default router;
