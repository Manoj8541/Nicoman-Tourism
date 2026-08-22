// api/admin/queries.js
// Protected admin endpoint for customer queries (contact form submissions).
// GET  /api/admin/queries          → list all queries with full threaded query_messages
// PUT  /api/admin/queries?id=...   → reply to a query (inserts admin query_message, sends email via Resend with reply_token & Reply-To, updates status)

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('customer_queries')
        .select('*, query_messages(*)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without relations if query_messages table doesn't exist yet
        const { data: fallbackData, error: fallbackErr } = await supabaseAdmin
          .from('customer_queries')
          .select('*')
          .order('created_at', { ascending: false });
        if (fallbackErr) throw fallbackErr;
        return res.status(200).json(fallbackData || []);
      }

      // Sort thread messages chronologically
      const enriched = (data || []).map(q => ({
        ...q,
        query_messages: (q.query_messages || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));

      return res.status(200).json(enriched);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const replyText = req.body.admin_reply || req.body.message || '';
      const status = req.body.status || 'replied';

      if (!replyText.trim()) {
        return res.status(400).json({ error: 'admin_reply is required' });
      }

      // Fetch the query to get recipient details and thread token
      const { data: query, error: fetchErr } = await supabaseAdmin
        .from('customer_queries')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !query) return res.status(404).json({ error: 'Query not found' });

      // Ensure reply_token exists
      let replyToken = query.reply_token;
      if (!replyToken) {
        replyToken = Math.random().toString(36).substring(2, 10);
        await supabaseAdmin
          .from('customer_queries')
          .update({ reply_token: replyToken })
          .eq('id', id);
      }

      // 1. Insert admin message into query_messages table
      let insertedMessageId = null;
      try {
        const { data: msgData } = await supabaseAdmin
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
      } catch (tableErr) {
        console.warn('[admin/queries] query_messages insert warning:', tableErr.message);
      }

      // 2. Send threaded reply email via Resend
      const resendKey = process.env.RESEND_API_KEY;
      const inboundAddress = process.env.RESEND_INBOUND_ADDRESS || 'support@coruebjen.resend.app';
      let resendEmailId = null;

      if (resendKey && query.email) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(resendKey);

          const subjectLine = query.subject
            ? `Re: ${query.subject} [#${replyToken}]`
            : `Re: Your message to Nicoman Tourism [#${replyToken}]`;

          const emailResult = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Nicoman Tourism <support@nicoman.man-ray.is-a.dev>',
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
            // Store resend_email_id on the inserted query_message
            if (insertedMessageId) {
              await supabaseAdmin
                .from('query_messages')
                .update({ resend_email_id: resendEmailId })
                .eq('id', insertedMessageId);
            }
          }
        } catch (emailErr) {
          console.error('[admin/queries] Resend error:', emailErr.message);
          // Non-fatal — reply is still saved in DB
        }
      }

      // 3. Update customer_queries row (status and admin_reply for backward compatibility)
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('customer_queries')
        .update({
          admin_reply: replyText.trim(),
          status: status || 'replied',
          reply_token: replyToken,
        })
        .eq('id', id)
        .select('*, query_messages(*)')
        .single();

      if (updateErr) throw updateErr;
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/queries]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
