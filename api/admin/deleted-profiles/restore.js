// api/admin/deleted-profiles/restore.js
// POST /api/admin/deleted-profiles/restore — Restore archived account back to profiles

import { supabaseAdmin } from '../../_lib/supabase-admin.js';
import { requireAdmin } from '../../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabaseAdmin
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      return res.status(404).json({ error: 'Deleted account record not found in archive.' });
    }

    const email = delProf.email?.trim().toLowerCase();
    const targetUserId = delProf.user_id;

    // 1. Ensure a valid user exists in auth.users
    let validAuthUserId = null;

    if (targetUserId) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (authUser?.user) {
          validAuthUserId = authUser.user.id;
        }
      } catch (e) {}
    }

    if (!validAuthUserId && email) {
      try {
        const { data: listRes } = await supabaseAdmin.auth.admin.listUsers();
        const matched = (listRes?.users || []).find(u => u.email?.toLowerCase() === email);
        if (matched) {
          validAuthUserId = matched.id;
        }
      } catch (e) {}
    }

    if (!validAuthUserId && email) {
      try {
        const { data: newAuth } = await supabaseAdmin.auth.admin.createUser({
          email: delProf.email,
          email_confirm: true,
          user_metadata: {
            full_name: delProf.full_name,
            avatar_url: delProf.avatar_url,
          },
        });
        if (newAuth?.user) {
          validAuthUserId = newAuth.user.id;
        }
      } catch (authCreateErr) {
        console.warn('[restore auth user creation]:', authCreateErr.message);
      }
    }

    // 2. Check if profile already exists in profiles
    let existingProfile = null;
    if (validAuthUserId) {
      const { data: byUid } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', validAuthUserId)
        .maybeSingle();
      existingProfile = byUid;
    }
    if (!existingProfile && email) {
      const { data: byEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existingProfile = byEmail;
    }

    const finalUserId = validAuthUserId || existingProfile?.user_id || targetUserId;

    const restorePayload = {
      user_id: finalUserId,
      email: delProf.email,
      full_name: existingProfile?.full_name || delProf.full_name,
      phone: existingProfile?.phone || delProf.phone,
      role: delProf.role || existingProfile?.role || 'user',
      avatar_url: existingProfile?.avatar_url || delProf.avatar_url,
      created_at: delProf.created_at || existingProfile?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let restored = null;
    let insErr = null;

    if (existingProfile) {
      const resUpdate = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: restorePayload.full_name,
          phone: restorePayload.phone,
          role: restorePayload.role,
          avatar_url: restorePayload.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', existingProfile.user_id)
        .select()
        .single();
      restored = resUpdate.data;
      insErr = resUpdate.error;
    } else {
      const resInsert = await supabaseAdmin
        .from('profiles')
        .insert([restorePayload])
        .select()
        .single();
      restored = resInsert.data;
      insErr = resInsert.error;
    }

    if (insErr) {
      console.error('[restore profile error]:', insErr.message);
      return res.status(500).json({ error: insErr.message });
    }

    // 3. Relink bookings and queries
    if (targetUserId && finalUserId && targetUserId !== finalUserId) {
      try {
        await supabaseAdmin.from('bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabaseAdmin.from('ferry_bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabaseAdmin.from('customer_queries').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabaseAdmin.from('feedback').update({ user_id: finalUserId }).eq('user_id', targetUserId);
      } catch (linkErr) {
        console.warn('[restore history relink]:', linkErr.message);
      }
    }

    // 4. Clean up from deleted_profiles
    await supabaseAdmin.from('deleted_profiles').delete().eq('user_id', targetUserId);
    if (validAuthUserId) {
      await supabaseAdmin.from('deleted_profiles').delete().eq('user_id', validAuthUserId);
    }
    if (email) {
      await supabaseAdmin.from('deleted_profiles').delete().eq('email', email);
    }

    return res.status(200).json({
      success: true,
      message: `Account ${delProf.email} restored successfully!`,
      data: restored,
    });
  } catch (err) {
    console.error('[admin/deleted-profiles/restore]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
