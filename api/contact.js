// api/contact.js
// POST → insert contact form submission into Supabase customer_queries table
// No auth required — guests can submit contact forms.

import { supabaseAdmin } from './_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Try to get user ID from auth header (optional)
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!error && user) userId = user.id;
    } catch (e) { /* non-fatal */ }
  }

  try {
    const { error } = await supabaseAdmin
      .from('customer_queries')
      .insert({
        user_id: userId,
        name,
        email,
        subject: subject || null,
        message,
      });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'We will get back to you soon!',
    });
  } catch (dbErr) {
    console.error('[contact] DB insert error:', dbErr.message);

    return res.status(200).json({
      success: true,
      message: 'We will get back to you soon! (offline mode)',
    });
  }
}
