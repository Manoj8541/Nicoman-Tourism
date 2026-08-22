// api/webhooks/resend-inbound.js
// Receives `email.received` event from Resend, parses thread token, and appends to query_messages.

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { Webhook } from 'svix';

// Disable Vercel's default JSON body parser to obtain raw bytes for Svix signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to buffer the raw request stream
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper to strip standard email quotes (lines starting with >, "On ... wrote:", etc.)
function stripQuotedContent(rawText) {
  if (!rawText) return '';
  const lines = rawText.split(/\r?\n/);
  const cleaned = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Quoted lines with >
    if (trimmed.startsWith('>')) break;
    // 2. "On <date>, <sender> wrote:"
    if (/^On\s+.+wrote:?$/i.test(trimmed)) break;
    // 3. "-----Original Message-----"
    if (/^-+\s*Original Message\s*-+/i.test(trimmed)) break;
    // 4. "From: <someone>" followed by Sent/To/Subject
    if (/^From:\s+.+/i.test(trimmed) && i + 1 < lines.length && /^(Sent|Date|To|Subject):/i.test(lines[i + 1].trim())) {
      break;
    }

    cleaned.push(line);
  }

  const result = cleaned.join('\n').trim();
  return result || rawText.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── STEP 1: Verify Webhook Signature (Mandatory) ───────────────────────────
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-inbound] RESEND_WEBHOOK_SECRET is not configured in environment variables');
    return res.status(500).json({ error: 'Server webhook secret misconfigured' });
  }

  let rawBuffer;
  try {
    rawBuffer = await getRawBody(req);
  } catch (err) {
    console.error('[resend-inbound] Failed to read raw body:', err.message);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[resend-inbound] Missing required Svix signature headers');
    return res.status(401).json({ error: 'Missing webhook signature headers' });
  }

  let payload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(rawBuffer.toString('utf8'), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.warn('[resend-inbound] Invalid Svix signature:', err.message);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // ── STEP 2: Parse and Validate Event ─────────────────────────────────────────
  if (!payload || payload.type !== 'email.received') {
    console.log('[resend-inbound] Ignored non-email.received event:', payload?.type);
    return res.status(200).json({ message: 'Ignored non-email.received event' });
  }

  const emailData = payload.data || {};
  const emailId = emailData.email_id || emailData.id;
  const subject = emailData.subject || '';

  // ── STEP 3: Extract Thread Token from Subject ────────────────────────────────
  // Matches [#a1b2c3d4] case-insensitively, handling "Re:", "RE:", "Fwd:", etc.
  const tokenMatch = subject.match(/\[#([a-f0-9]{8})\]/i);
  if (!tokenMatch) {
    console.log(`[resend-inbound] No thread token found in subject: "${subject}". Skipping.`);
    return res.status(200).json({ message: 'No thread token matched, skipped' });
  }

  const extractedToken = tokenMatch[1].toLowerCase();

  // ── STEP 4: Look up Matching Query ──────────────────────────────────────────
  const { data: query, error: queryErr } = await supabaseAdmin
    .from('customer_queries')
    .select('id, email, status, name')
    .eq('reply_token', extractedToken)
    .maybeSingle();

  if (queryErr || !query) {
    console.warn(`[resend-inbound] No query found for reply_token [#${extractedToken}]. (Might be deleted)`);
    return res.status(200).json({ message: 'No matching query found, skipped' });
  }

  // ── STEP 5: Check Idempotency on resend_email_id ─────────────────────────────
  if (emailId) {
    const { data: existingMsg } = await supabaseAdmin
      .from('query_messages')
      .select('id')
      .eq('resend_email_id', emailId)
      .maybeSingle();

    if (existingMsg) {
      console.log(`[resend-inbound] Message for resend_email_id ${emailId} already processed.`);
      return res.status(200).json({ message: 'Duplicate webhook event skipped (idempotent)' });
    }
  }

  // ── STEP 6: Fetch Full Email Body from Resend Receiving API ─────────────────
  let fullBodyText = '';
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey && emailId) {
    try {
      // 1. Try Resend Receiving API endpoint
      const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      });

      if (response.ok) {
        const fullEmail = await response.json();
        fullBodyText = fullEmail.text || fullEmail.html?.replace(/<[^>]*>/g, ' ') || '';
      } else {
        // 2. Fallback to standard emails endpoint
        const fallbackRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${resendApiKey}` },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          fullBodyText = fallbackData.text || fallbackData.html?.replace(/<[^>]*>/g, ' ') || '';
        }
      }
    } catch (fetchErr) {
      console.error('[resend-inbound] Error fetching full email from Resend:', fetchErr.message);
    }
  }

  // If body fetch failed, use fallback message (do not drop event)
  const finalMessage = fullBodyText
    ? stripQuotedContent(fullBodyText)
    : 'Reply received via email (content preview unavailable).';

  // ── STEP 7: Insert Customer Reply into Thread ────────────────────────────────
  const { error: insertErr } = await supabaseAdmin
    .from('query_messages')
    .insert([
      {
        query_id: query.id,
        sender_type: 'customer',
        message: finalMessage || 'Reply received.',
        resend_email_id: emailId || null,
      },
    ]);

  if (insertErr) {
    // If it's a unique constraint violation, it's safe to acknowledge as duplicate
    if (insertErr.code === '23505' || insertErr.message?.includes('duplicate key')) {
      console.log('[resend-inbound] Handled duplicate insertion race condition.');
      return res.status(200).json({ message: 'Duplicate message prevented' });
    }
    console.error('[resend-inbound] Failed to insert query message:', insertErr.message);
    return res.status(500).json({ error: 'Database insert failed' });
  }

  // ── STEP 8: Reopen Query Status ─────────────────────────────────────────────
  // Customer replied -> flip status back to 'open' to alert admins
  await supabaseAdmin
    .from('customer_queries')
    .update({ status: 'open' })
    .eq('id', query.id);

  console.log(`[resend-inbound] Successfully appended customer reply to query ${query.id} [#${extractedToken}]`);
  return res.status(200).json({ success: true, query_id: query.id });
}
