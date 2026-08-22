// api/admin/hotels.js
// Protected admin CRUD for the hotels table.
// GET    /api/admin/hotels          → list all hotels
// POST   /api/admin/hotels          → create hotel
// PUT    /api/admin/hotels?id=...   → update hotel
// DELETE /api/admin/hotels?id=...   → delete hotel

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

async function cleanupStorageImage(imageUrl, bucket = 'place-images') {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  let path = imageUrl;
  if (imageUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
    path = imageUrl.split(`/storage/v1/object/public/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.includes(`/${bucket}/`)) {
    path = imageUrl.split(`/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.startsWith('http')) {
    return;
  } else {
    path = imageUrl.split('?')[0];
  }
  if (!path) return;
  try {
    await supabaseAdmin.storage.from(bucket).remove([path]);
    console.log(`[admin/hotels] Removed ${bucket}/${path}`);
  } catch (err) {
    console.warn(`[admin/hotels] Storage cleanup warning for ${path}:`, err.message);
  }
}

export default async function handler(req, res) {
  // Enforce admin auth on all methods
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    // ── GET: list all hotels ────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ── POST: create hotel ──────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { name, location, description, image_url, price_per_night, rating, amenities, category } = req.body;
      if (!name || !location || !price_per_night) {
        return res.status(400).json({ error: 'name, location, and price_per_night are required' });
      }
      const { data, error } = await supabaseAdmin
        .from('hotels')
        .insert({ name, location, description, image_url, price_per_night, rating, amenities, category })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // ── PUT: update hotel ───────────────────────────────────────────────────
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { name, location, description, image_url, price_per_night, rating, amenities, category } = req.body;

      if (image_url !== undefined) {
        const { data: existing } = await supabaseAdmin.from('hotels').select('image_url').eq('id', id).maybeSingle();
        if (existing?.image_url && existing.image_url !== image_url) {
          await cleanupStorageImage(existing.image_url, 'place-images');
        }
      }

      const { data, error } = await supabaseAdmin
        .from('hotels')
        .update({ name, location, description, image_url, price_per_night, rating, amenities, category })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ── DELETE: delete hotel ────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { data: existing } = await supabaseAdmin.from('hotels').select('image_url').eq('id', id).maybeSingle();
      if (existing?.image_url) {
        await cleanupStorageImage(existing.image_url, 'place-images');
      }

      const { error } = await supabaseAdmin.from('hotels').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/hotels]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
