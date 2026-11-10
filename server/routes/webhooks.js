import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

function stripQuotedEmailContent(rawText) {
  if (!rawText) return '';
  const lines = rawText.split(/\r?\n/);
  const cleaned = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) break;
    if (/^On\s+.+wrote:?$/i.test(trimmed)) break;
    if (/^-+\s*Original Message\s*-+/i.test(trimmed)) break;
    if (/^From:\s+.+/i.test(trimmed) && i + 1 < lines.length && /^(Sent|Date|To|Subject):/i.test(lines[i + 1].trim())) break;
    cleaned.push(line);
  }

  const result = cleaned.join('\n').trim();
  return result || rawText.trim();
}

// ── Inbound Resend Webhook Handler (V2 Feature 6) ───────────────────────────
router.post('/webhooks/resend-inbound', async (req, res) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-inbound] RESEND_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBuffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[resend-inbound] Missing Svix headers');
    return res.status(401).json({ error: 'Missing webhook signature headers' });
  }

  let payload;
  try {
    const { Webhook } = await import('svix');
    const wh = new Webhook(secret);
    payload = wh.verify(rawBuffer.toString('utf8'), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.warn('[resend-inbound] Signature verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (!payload || payload.type !== 'email.received') {
    return res.status(200).json({ message: 'Ignored non-email.received event' });
  }

  const emailData = payload.data || {};
  const emailId = emailData.email_id || emailData.id;
  const subject = emailData.subject || '';

  const match = subject.match(/\[#([a-f0-9]{8})\]/i);
  if (!match) {
    console.log(`[resend-inbound] No thread token found in subject: "${subject}"`);
    return res.status(200).json({ message: 'No thread token, skipped' });
  }

  const extractedToken = match[1].toLowerCase();

  try {
    const { data: query, error: queryErr } = await supabase
      .from('customer_queries')
      .select('id, email, status, name')
      .eq('reply_token', extractedToken)
      .maybeSingle();

    if (queryErr || !query) {
      console.warn(`[resend-inbound] No query found for token: ${extractedToken}`);
      return res.status(200).json({ message: 'No matching query, skipped' });
    }

    if (emailId) {
      const { data: existingMsg } = await supabase
        .from('query_messages')
        .select('id')
        .eq('resend_email_id', emailId)
        .maybeSingle();

      if (existingMsg) {
        console.log(`[resend-inbound] Duplicate message for ${emailId} skipped.`);
        return res.status(200).json({ message: 'Duplicate event skipped' });
      }
    }

    let fullBodyText = '';
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && emailId) {
      try {
        const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
          headers: { Authorization: `Bearer ${resendApiKey}` },
        });
        if (response.ok) {
          const fullEmail = await response.json();
          fullBodyText = fullEmail.text || fullEmail.html?.replace(/<[^>]*>/g, ' ') || '';
        } else {
          const fallbackRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
            headers: { Authorization: `Bearer ${resendApiKey}` },
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            fullBodyText = fallbackData.text || fallbackData.html?.replace(/<[^>]*>/g, ' ') || '';
          }
        }
      } catch (fetchErr) {
        console.error('[resend-inbound] Resend email fetch error:', fetchErr.message);
      }
    }

    const finalMessage = fullBodyText
      ? stripQuotedEmailContent(fullBodyText)
      : 'Reply received via email (content preview unavailable).';

    await supabase.from('query_messages').insert([
      {
        query_id: query.id,
        sender_type: 'customer',
        message: finalMessage || 'Reply received.',
        resend_email_id: emailId || null,
      },
    ]);

    await supabase
      .from('customer_queries')
      .update({ status: 'open' })
      .eq('id', query.id);

    console.log(`[resend-inbound] Appended customer reply to query ${query.id} [#${extractedToken}]`);
    return res.status(200).json({ success: true, query_id: query.id });
  } catch (err) {
    console.error('[resend-inbound] Webhook handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
