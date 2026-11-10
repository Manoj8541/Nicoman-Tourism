import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAdmin, requireSuperAdmin, cleanupStorageImage } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/hotels', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('hotels').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/admin/hotels', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('hotels').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.put('/admin/hotels', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup old storage image if replaced or removed
  if (req.body.image_url !== undefined) {
    const { data: existing } = await supabase.from('hotels').select('image_url').eq('id', id).maybeSingle();
    if (existing?.image_url && existing.image_url !== req.body.image_url) {
      await cleanupStorageImage(existing.image_url, 'place-images');
    }
  }

  const { data, error } = await supabase.from('hotels').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/admin/hotels', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup storage image before deletion
  const { data: existing } = await supabase.from('hotels').select('image_url').eq('id', id).maybeSingle();
  if (existing?.image_url) {
    await cleanupStorageImage(existing.image_url, 'place-images');
  }

  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Tourist Places ─────────────────────────────────────────────────────
router.get('/admin/tourist-places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('tourist_places').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/admin/tourist-places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('tourist_places').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.put('/admin/tourist-places', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup old storage image if replaced or removed
  if (req.body.image_url !== undefined) {
    const { data: existing } = await supabase.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
    if (existing?.image_url && existing.image_url !== req.body.image_url) {
      await cleanupStorageImage(existing.image_url, 'place-images');
    }
  }

  const { data, error } = await supabase.from('tourist_places').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/admin/tourist-places', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup storage image before deletion
  const { data: existing } = await supabase.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
  if (existing?.image_url) {
    await cleanupStorageImage(existing.image_url, 'place-images');
  }

  const { error } = await supabase.from('tourist_places').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Ship Schedule ──────────────────────────────────────────────────────
router.get('/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ship_schedule').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ship_schedule').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.put('/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase.from('ship_schedule').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('ship_schedule').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

const ALL_HOTEL_ROOMS = ['101', '102', '103', '104', '105', '106', '107', '108', '201', '202', '203', '204', '205', '206', '207', '208', '301', '302', '303', '304'];
const ALL_FERRY_SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

function extractUnitsFromRef(ref) {
  if (!ref) return [];
  const match = ref.match(/(?:HTL|FRY)-([A-Za-z0-9\-_,]+)-ANI/i);
  if (match && match[1]) {
    return match[1].split(/[-_,]+/).filter(Boolean).map(s => s.toUpperCase());
  }
  return [];
}

// ── Admin: Bookings (Hotel Bookings with Conflict Detection) ──────────────────
router.get('/admin/bookings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/admin/bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { status, new_unit, force } = req.body;

  try {
    const { data: target, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !target) return res.status(404).json({ error: 'Booking not found' });

    let updatedRef = target.booking_ref;

    // When confirming, validate that unit isn't already occupied by another active booking
    if (status === 'confirmed') {
      const unitsToCheck = new_unit ? [new_unit.toUpperCase()] : extractUnitsFromRef(target.booking_ref);

      const { data: activeList } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .eq('hotel_name', target.hotel_name)
        .neq('id', id)
        .lt('check_in', target.check_out)
        .gt('check_out', target.check_in);

      const activeBookings = activeList || [];
      const occupiedUnits = new Set();
      const conflictingBookings = [];

      for (const b of activeBookings) {
        const bUnits = extractUnitsFromRef(b.booking_ref);
        for (const u of bUnits) {
          occupiedUnits.add(u);
          if (unitsToCheck.includes(u)) {
            conflictingBookings.push(b);
          }
        }
      }

      if (conflictingBookings.length > 0 && !force && !new_unit) {
        const availableUnits = ALL_HOTEL_ROOMS.filter(r => !occupiedUnits.has(r.toUpperCase()));
        return res.status(409).json({
          conflict: true,
          message: `Room ${unitsToCheck.join(', ')} is currently occupied by another confirmed guest on these dates.`,
          conflicting_units: unitsToCheck,
          conflicting_bookings: conflictingBookings,
          available_units: availableUnits,
        });
      }

      if (new_unit) {
        const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        updatedRef = `HTL-${new_unit.toUpperCase()}-ANI${randHex}`;
      }
    }

    const updatePayload = { status };
    if (new_unit) updatePayload.booking_ref = updatedRef;

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Ferry Bookings (Ship Bookings with Conflict Detection) ─────────────
router.get('/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('ferry_bookings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { status, new_unit, force } = req.body;

  try {
    const { data: target, error: fetchErr } = await supabase
      .from('ferry_bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !target) return res.status(404).json({ error: 'Ferry booking not found' });

    let updatedRef = target.booking_ref;

    if (status === 'confirmed') {
      const unitsToCheck = new_unit ? [new_unit.toUpperCase()] : extractUnitsFromRef(target.booking_ref);

      const { data: activeList } = await supabase
        .from('ferry_bookings')
        .select('*')
        .eq('status', 'confirmed')
        .eq('ship_name', target.ship_name)
        .eq('travel_date', target.travel_date)
        .neq('id', id);

      const activeBookings = activeList || [];
      const occupiedUnits = new Set();
      const conflictingBookings = [];

      for (const b of activeBookings) {
        const bUnits = extractUnitsFromRef(b.booking_ref);
        for (const u of bUnits) {
          occupiedUnits.add(u);
          if (unitsToCheck.includes(u)) {
            conflictingBookings.push(b);
          }
        }
      }

      if (conflictingBookings.length > 0 && !force && !new_unit) {
        const availableUnits = ALL_FERRY_SEATS.filter(s => !occupiedUnits.has(s.toUpperCase()));
        return res.status(409).json({
          conflict: true,
          message: `Seat ${unitsToCheck.join(', ')} is already booked by another passenger for this voyage.`,
          conflicting_units: unitsToCheck,
          conflicting_bookings: conflictingBookings,
          available_units: availableUnits,
        });
      }

      if (new_unit) {
        const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        updatedRef = `FRY-${new_unit.toUpperCase()}-ANI${randHex}`;
      }
    }

    const updatePayload = { status };
    if (new_unit) updatePayload.booking_ref = updatedRef;

    const { data, error } = await supabase
      .from('ferry_bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('ferry_bookings').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Queries (contact form submissions with thread messages & profile enrich) ──
router.get('/admin/queries', requireAdmin, async (req, res) => {
  let queries = [];
  try {
    const { data: qData, error: qErr } = await supabase
      .from('customer_queries')
      .select('*, query_messages(*)')
      .order('created_at', { ascending: false });

    if (qErr) {
      // Fallback if query_messages table doesn't exist yet
      const { data: plainData } = await supabase
        .from('customer_queries')
        .select('*')
        .order('created_at', { ascending: false });
      queries = plainData || [];
    } else {
      queries = (qData || []).map(q => ({
        ...q,
        query_messages: (q.query_messages || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));
    }
  } catch {
    const { data: plainData } = await supabase
      .from('customer_queries')
      .select('*')
      .order('created_at', { ascending: false });
    queries = plainData || [];
  }

  try {
    // Enrich with avatar_url & phone from profiles if available
    const emails = [...new Set((queries || []).map(q => q.email?.toLowerCase()).filter(Boolean))];
    const profileMap = {};
    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, avatar_url, full_name, phone')
        .in('email', emails);
      if (profiles) {
        profiles.forEach(p => {
          if (p.email) profileMap[p.email.toLowerCase()] = p;
        });
      }
    }

    const enriched = (queries || []).map(q => {
      const p = profileMap[q.email?.toLowerCase()];
      return {
        ...q,
        avatar_url: p?.avatar_url || null,
        user_phone: p?.phone || q.phone || null,
        user_profile_name: p?.full_name || null,
      };
    });
    res.json(enriched);
  } catch (err) {
    res.json(queries || []);
  }
});

router.put('/admin/queries', requireAdmin, async (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const replyText = req.body.admin_reply || req.body.message || '';
  const status = req.body.status || 'replied';

  if (!replyText.trim()) {
    return res.status(400).json({ error: 'admin_reply is required' });
  }

  try {
    // Fetch query details
    const { data: query, error: fetchErr } = await supabase
      .from('customer_queries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !query) return res.status(404).json({ error: 'Query not found' });

    // Ensure reply_token
    let replyToken = query.reply_token;
    if (!replyToken) {
      replyToken = Math.random().toString(36).substring(2, 10);
      await supabase
        .from('customer_queries')
        .update({ reply_token: replyToken })
        .eq('id', id);
    }

    // 1. Insert admin message into query_messages table
    let insertedMessageId = null;
    try {
      const { data: msgData } = await supabase
        .from('query_messages')
        .insert([
          {
            query_id: id,
            sender_type: 'admin',
            message: replyText.trim(),
          },
        ])
        .select()
        .single();
      if (msgData) insertedMessageId = msgData.id;
    } catch (msgErr) {
      console.warn('[admin/queries] query_messages insert warning:', msgErr.message);
    }

    // 2. Send email via Resend with reply_to header and subject token
    const resendKey = process.env.RESEND_API_KEY;
    const inboundAddress = process.env.RESEND_INBOUND_ADDRESS;
    let resendEmailId = null;

    if (resendKey && query.email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        const subjectLine = query.subject
          ? `Re: ${query.subject} [#${replyToken}]`
          : `Re: Your message to Nicoman Tourism [#${replyToken}]`;

        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          reply_to: inboundAddress,
          to: query.email,
          subject: subjectLine,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 28px 32px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Nicoman Tourism Support</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 4px 0 0 0; font-size: 13px;">Reference Token: [#${replyToken}]</p>
              </div>
              <div style="padding: 28px 32px;">
                <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">Hello <strong>${query.name || 'Traveler'}</strong>,</p>
                <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">Our support team has replied to your query:</p>

                <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                  <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${replyText.trim()}</p>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                  <p style="color: #64748b; font-size: 12px; margin: 0 0 6px 0; font-weight: 600;">Your Original Message:</p>
                  <p style="color: #94a3b8; font-size: 13px; margin: 0; font-style: italic; line-height: 1.5;">"${query.message}"</p>
                </div>

                <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    💬 <strong>Need to reply?</strong> Simply reply directly to this email and your response will attach to this thread automatically.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        if (emailResult?.data?.id) {
          resendEmailId = emailResult.data.id;
          if (insertedMessageId) {
            await supabase
              .from('query_messages')
              .update({ resend_email_id: resendEmailId })
              .eq('id', insertedMessageId);
          }
        }
      } catch (emailErr) {
        console.error('[server:admin/queries] Resend error:', emailErr.message);
      }
    }

    // 3. Update customer_queries row
    const { data: updated, error: updateErr } = await supabase
      .from('customer_queries')
      .update({
        admin_reply: replyText.trim(),
        status: status || 'replied',
        reply_token: replyToken,
      })
      .eq('id', id)
      .select('*, query_messages(*)')
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Feedback ───────────────────────────────────────────────────────────
router.get('/admin/feedback', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('feedback').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.put('/admin/feedback', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase
    .from('feedback').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/admin/feedback', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Alerts ─────────────────────────────────────────────────────────────
router.get('/admin/alerts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('alerts').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.post('/admin/alerts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('alerts').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.put('/admin/alerts', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase
    .from('alerts').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete('/admin/alerts', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Manage Admins (Superadmin only) ────────────────────────────────────
router.get('/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'superadmin'])
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(a => ({
    id: a.user_id || a.id,
    user_id: a.user_id || a.id,
    full_name: a.full_name,
    email: a.email,
    phone: a.phone,
    avatar_url: a.avatar_url,
    role: a.role,
    created_at: a.created_at,
  }));
  res.json(mapped);
});

// User Lookup for Superadmin
router.get('/admin/user-lookup', requireSuperAdmin, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email parameter required' });
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, phone, role, avatar_url, created_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error || !profile) return res.status(404).json({ error: 'User not found' });
  res.json(profile);
});

router.post('/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const { data: profile, error: findErr } = await supabase
    .from('profiles').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
  if (findErr || !profile) return res.status(404).json({ error: 'User not found. They must sign up first.' });
  if (profile.role === 'superadmin') return res.status(400).json({ error: 'Cannot modify a superadmin account.' });

  const uid = profile.user_id;
  const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
router.delete('/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  let { data: profile } = await supabase.from('profiles').select('*').eq('user_id', id).maybeSingle();
  if (profile?.role === 'superadmin') return res.status(400).json({ error: 'Cannot demote a superadmin.' });

  const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('user_id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Deleted Accounts / Deleted Profiles ────────────────────────────────
router.get('/admin/deleted-profiles', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('deleted_profiles')
    .select('*')
    .order('deleted_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    id: d.user_id || d.id,
    user_id: d.user_id || d.id,
    email: d.email,
    full_name: d.full_name,
    phone: d.phone,
    role: d.role,
    avatar_url: d.avatar_url,
    deleted_at: d.deleted_at,
    scheduled_purge_at: d.scheduled_purge_at,
    deletion_reason: d.deletion_reason,
    created_at: d.created_at,
  }));
  res.json(mapped);
});

// Revoke / Restore Account from deleted_profiles back to profiles
router.post('/admin/deleted-profiles/restore', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabase
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      return res.status(404).json({ error: 'Deleted account record not found in archive.' });
    }

    const email = delProf.email?.trim().toLowerCase();
    const targetUserId = delProf.user_id;

    // 1. Ensure a valid user exists in auth.users for foreign key constraint
    let validAuthUserId = null;

    if (targetUserId) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(targetUserId);
        if (authUser?.user) {
          validAuthUserId = authUser.user.id;
        }
      } catch (e) { }
    }

    if (!validAuthUserId && email) {
      try {
        const { data: listRes } = await supabase.auth.admin.listUsers();
        const matched = (listRes?.users || []).find(u => u.email?.toLowerCase() === email);
        if (matched) {
          validAuthUserId = matched.id;
        }
      } catch (e) { }
    }

    // If user was deleted from auth.users, recreate in auth.users so foreign key constraint is satisfied
    if (!validAuthUserId && email) {
      try {
        const { data: newAuth } = await supabase.auth.admin.createUser({
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

    // Check if a profile with this user_id or email already exists in profiles
    let existingProfile = null;
    if (validAuthUserId) {
      const { data: byUid } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', validAuthUserId)
        .maybeSingle();
      existingProfile = byUid;
    }
    if (!existingProfile && email) {
      const { data: byEmail } = await supabase
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
      // Update existing profile
      const resUpdate = await supabase
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
      // Insert new profile
      const resInsert = await supabase
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

    // Link historical bookings and queries to the new valid user_id if changed
    if (targetUserId && finalUserId && targetUserId !== finalUserId) {
      try {
        await supabase.from('bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('ferry_bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('customer_queries').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('feedback').update({ user_id: finalUserId }).eq('user_id', targetUserId);
      } catch (linkErr) {
        console.warn('[restore history relink]:', linkErr.message);
      }
    }

    // ── Generate password reset link & notify user via Resend ─────────────
    let recoveryLink = null;
    try {
      const origin = req.headers.origin || 'https://nicoman-tourism.vercel.app';
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: delProf.email,
        options: { redirectTo: `${origin}/reset-password` },
      });
      if (linkData?.properties?.action_link) {
        recoveryLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.warn('[restore generateLink warning]:', linkErr.message);
    }

    // Send email notification to user via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && delProf.email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const origin = req.headers.origin || 'https://nicoman-tourism.vercel.app';
        const actionUrl = recoveryLink || `${origin}/reset-password`;

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: delProf.email,
          subject: 'Your Nicoman Tourism Account Has Been Restored! 🌴',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 28px 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Welcome Back to Nicoman Tourism! 🏝️</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Account Restored Successfully</p>
              </div>
              <div style="padding: 28px 32px;">
                <p style="color: #475569; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${delProf.full_name || 'Traveler'}</strong>,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                  Good news! Your deleted Nicoman Tourism account (<strong>${delProf.email}</strong>) has been reviewed and restored by our team.
                </p>
                <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                  <p style="color: #0f172a; font-size: 14px; margin: 0 0 6px 0; font-weight: 700;">How to log in:</p>
                  <ul style="color: #334155; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.6;">
                    <li><strong>Google Sign-In:</strong> Simply click "Sign in with Google" on the login page.</li>
                    <li><strong>Email & Password:</strong> Click the button below to set your password.</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${actionUrl}" style="background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);">
                    Set Your Password & Log In →
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                  If you did not request this restoration, please contact our support team at <a href="mailto:nicomantourism.myth520@silomails.com" style="color: #14b8a6;">nicomantourism.myth520@silomails.com</a>.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[restore] Sent account restoration email to ${delProf.email}`);
      } catch (emailErr) {
        console.warn('[restore email notification warning]:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Account ${delProf.email} restored successfully! Password recovery link sent to user.`,
      recovery_link: recoveryLink,
      data: restored,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently Purge Account and All Traces across All Tables
router.delete('/admin/deleted-profiles/purge', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabase
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      const fallback = await supabase
        .from('deleted_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      delProf = fallback.data;
    }

    const email = delProf?.email?.trim().toLowerCase();
    const targetUserId = id;

    // 1. Delete from deleted_profiles (by user_id, id, and email)
    await supabase.from('deleted_profiles').delete().eq('user_id', targetUserId);
    await supabase.from('deleted_profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabase.from('deleted_profiles').delete().eq('email', email);
    }

    // 2. Delete from profiles (by user_id, id, and email)
    await supabase.from('profiles').delete().eq('user_id', targetUserId);
    await supabase.from('profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabase.from('profiles').delete().eq('email', email);
    }

    // 3. Delete all traces across other tables
    await supabase.from('customer_queries').delete().eq('user_id', targetUserId);
    await supabase.from('feedback').delete().eq('user_id', targetUserId);
    await supabase.from('bookings').delete().eq('user_id', targetUserId);
    await supabase.from('ferry_bookings').delete().eq('user_id', targetUserId);

    if (email) {
      await supabase.from('customer_queries').delete().eq('email', email);
      await supabase.from('feedback').delete().eq('email', email);
      await supabase.from('bookings').delete().eq('email', email);
      await supabase.from('ferry_bookings').delete().eq('email', email);
    }

    // 4. Delete from auth.users (if still exists)
    try {
      await supabase.auth.admin.deleteUser(targetUserId);
    } catch (authErr) {
      // Ignored if already deleted
    }

    res.json({
      success: true,
      message: `Account ${email || targetUserId} and all traces permanently purged from all tables.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
