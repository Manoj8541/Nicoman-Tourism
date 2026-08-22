// api/verify-turnstile.js
// Server-side Cloudflare Turnstile token verification.
// Called from the signup flow before creating a Supabase auth account.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Layer 2: Cloudflare Turnstile CAPTCHA ──────────────────────────────────
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing Turnstile token' });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[verify-turnstile] No TURNSTILE_SECRET_KEY — bypassing in dev mode');
      return res.status(200).json({ success: true, dev_bypass: true });
    }
    return res.status(500).json({ success: false, error: 'Turnstile not configured' });
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: formData }
    );
    const data = await verifyRes.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: 'CAPTCHA verification failed' });
    }
  } catch (err) {
    console.error('[verify-turnstile] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal error during CAPTCHA verification' });
  }
}
