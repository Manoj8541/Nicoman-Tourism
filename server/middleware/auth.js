import { supabase } from '../lib/supabase.js';

// ── Admin Auth Middleware with High-Speed Token Caching ───────────────────────
const tokenCache = new Map(); // token -> { user, role, expiresAt }

export const verifyTokenAndRole = async (token) => {
  if (!supabase) return { user: null, role: null, error: 'Database not configured' };

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user, role: cached.role, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, role: null, error: 'Invalid or expired token' };

  let { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).maybeSingle();
  if (!profile) {
    const fallback = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    profile = fallback.data;
  }
  if (!profile) return { user: null, role: null, error: 'Profile not found' };

  // Cache verified user role for 5 minutes
  tokenCache.set(token, { user, role: profile.role, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { user, role: profile.role, error: null };
};

export const requireAdmin = async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { user, role, error } = await verifyTokenAndRole(token);
    if (error || !user) return res.status(401).json({ error: error || 'Unauthorized' });
    if (!['admin', 'superadmin', 'demo_admin'].includes(role))
      return res.status(403).json({ error: 'Admin access required' });

    // Block Demo Admin from mutating production data (except testing deleted accounts restore & purge)
    if (role === 'demo_admin' && req.method !== 'GET') {
      const path = req.path || req.originalUrl || '';
      const isAllowedDemoAction = path.includes('/deleted-profiles/restore') ||
        path.includes('/deleted-profiles/purge');
      if (!isAllowedDemoAction) {
        return res.status(403).json({
          error: 'Demo Admin mode is read-only. Modifying production data is disabled in demo mode.'
        });
      }
    }

    req.adminUser = user;
    req.adminRole = role;
    next();
  } catch (err) {
    console.error('[requireAdmin]', err.message);
    res.status(500).json({ error: 'Auth check failed' });
  }
};

export const requireSuperAdmin = async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { user, role, error } = await verifyTokenAndRole(token);
    if (error || !user) return res.status(401).json({ error: error || 'Unauthorized' });
    if (role !== 'superadmin')
      return res.status(403).json({ error: 'Superadmin access required' });
    req.adminUser = user;
    req.adminRole = role;
    next();
  } catch (err) {
    console.error('[requireSuperAdmin]', err.message);
    res.status(500).json({ error: 'Auth check failed' });
  }
};

// ── Helper: Storage Image Cleanup ─────────────────────────────────────────────
export const cleanupStorageImage = async (imageUrl, bucket = 'place-images') => {
  if (!imageUrl || typeof imageUrl !== 'string' || !supabase) return;
  let path = imageUrl;
  if (imageUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
    path = imageUrl.split(`/storage/v1/object/public/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.includes(`/${bucket}/`)) {
    path = imageUrl.split(`/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.startsWith('http')) {
    return; // external URL like Unsplash
  } else {
    path = imageUrl.split('?')[0];
  }
  if (!path) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
    console.log(`[storage-cleanup] Removed ${bucket}/${path}`);
  } catch (err) {
    console.warn(`[storage-cleanup] Warning removing ${path}:`, err.message);
  }
};
