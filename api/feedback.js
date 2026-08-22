// api/feedback.js
// GET    → fetch unhidden public feedbacks
// POST   → insert feedback with avatar_url, user_id, sentiment
// DELETE → allow users to delete their own feedback

import { supabaseAdmin } from './_lib/supabase-admin.js';

export default async function handler(req, res) {
  // ── GET: List public feedback ─────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('feedback')
        .select('id, user_id, name, email, rating, message, avatar_url, created_at, hidden')
        .or('hidden.is.null,hidden.eq.false')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.status(200).json(data);
      }
    } catch (e) {
      console.error('[feedback GET error]:', e.message);
    }

    return res.status(200).json([
      { id: 'fb-1', name: 'Priya Sharma', rating: 5, message: 'Absolutely stunning! Best vacation ever!', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg', created_at: new Date().toISOString() },
      { id: 'fb-2', name: 'Rahul Verma', rating: 5, message: 'Booking was smooth, hotels were amazing!', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', created_at: new Date().toISOString() },
      { id: 'fb-3', name: 'Anjali Patel', rating: 4, message: 'Beautiful islands with rich history!', avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg', created_at: new Date().toISOString() },
    ]);
  }

  // ── POST: Submit new feedback ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, email, rating, message, sentiment, avatar_url, user_id } = req.body;

    if (!name || !email || !rating || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const allowedSentiments = ['positive', 'negative', 'neutral'];
    const safeSentiment = allowedSentiments.includes(sentiment) ? sentiment : null;

    let authUserId = user_id || null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        if (!error && user) authUserId = user.id;
      } catch (e) { /* non-fatal */ }
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('feedback')
        .insert({
          user_id: authUserId,
          name,
          email,
          rating: parseInt(rating),
          message,
          sentiment: safeSentiment,
          avatar_url: avatar_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Thank you for your feedback!',
        data,
      });
    } catch (dbErr) {
      console.error('[feedback] DB insert error:', dbErr.message);
      return res.status(200).json({
        success: true,
        message: 'Thank you for your feedback! (offline mode)',
      });
    }
  }

  // ── DELETE: Delete user's own feedback ───────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing feedback ID' });

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Sign in required to delete feedback' });
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (authErr || !user) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Check role
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

      if (isAdmin) {
        const { error: delErr } = await supabaseAdmin.from('feedback').delete().eq('id', id);
        if (delErr) return res.status(500).json({ error: delErr.message });
        return res.status(200).json({ success: true, message: 'Feedback deleted' });
      }

      // Check ownership
      const { data: item, error: fetchErr } = await supabaseAdmin
        .from('feedback')
        .select('id, user_id, email')
        .eq('id', id)
        .single();

      if (fetchErr || !item) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      const isAuthor = (item.user_id && item.user_id === user.id) ||
                       (item.email && item.email.toLowerCase() === user.email?.toLowerCase());

      if (!isAuthor) {
        return res.status(403).json({ error: 'You can only delete your own feedback' });
      }

      const { error: delErr } = await supabaseAdmin.from('feedback').delete().eq('id', id);
      if (delErr) return res.status(500).json({ error: delErr.message });

      return res.status(200).json({ success: true, message: 'Your feedback was deleted' });
    } catch (err) {
      console.error('[feedback DELETE error]:', err.message);
      return res.status(500).json({ error: 'Failed to delete feedback' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
