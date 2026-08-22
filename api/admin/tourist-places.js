// api/admin/tourist-places.js
// Protected admin CRUD for the tourist_places table.
// GET    /api/admin/tourist-places          → list all
// POST   /api/admin/tourist-places          → create
// PUT    /api/admin/tourist-places?id=...   → update
// DELETE /api/admin/tourist-places?id=...   → delete

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
    console.log(`[admin/tourist-places] Removed ${bucket}/${path}`);
  } catch (err) {
    console.warn(`[admin/tourist-places] Storage cleanup warning for ${path}:`, err.message);
  }
}

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
        .from('tourist_places')
        .select('*')
        .order('rating', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name, location, description, image_url, category, rating, best_time } = req.body;
      if (!name || !location) {
        return res.status(400).json({ error: 'name and location are required' });
      }
      const { data, error } = await supabaseAdmin
        .from('tourist_places')
        .insert({ name, location, description, image_url, category, rating, best_time })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { name, location, description, image_url, category, rating, best_time } = req.body;

      if (image_url !== undefined) {
        const { data: existing } = await supabaseAdmin.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
        if (existing?.image_url && existing.image_url !== image_url) {
          await cleanupStorageImage(existing.image_url, 'place-images');
        }
      }

      const { data, error } = await supabaseAdmin
        .from('tourist_places')
        .update({ name, location, description, image_url, category, rating, best_time })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { data: existing } = await supabaseAdmin.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
      if (existing?.image_url) {
        await cleanupStorageImage(existing.image_url, 'place-images');
      }

      const { error } = await supabaseAdmin.from('tourist_places').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/tourist-places]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
