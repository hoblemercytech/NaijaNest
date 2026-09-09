import { supabase } from './supabase';

/**
 * The avatars bucket is private, so images need a signed URL. These are cached
 * in memory for the session — signing on every render would fire a request per
 * avatar in a customer list.
 */
const cache = new Map();
const TTL_SECONDS = 3600;

export async function avatarUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already a full URL

  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, TTL_SECONDS);

  if (error || !data?.signedUrl) return null;

  cache.set(path, {
    url: data.signedUrl,
    expires: Date.now() + (TTL_SECONDS - 60) * 1000,
  });
  return data.signedUrl;
}

/** Signs a batch of paths in one pass, for lists. */
export async function avatarUrls(paths = []) {
  const out = {};
  await Promise.all(
    [...new Set(paths.filter(Boolean))].map(async (p) => {
      out[p] = await avatarUrl(p);
    })
  );
  return out;
}

/**
 * Uploads and records a profile image.
 *
 * The write to `profiles` goes through nn_set_own_avatar rather than a table
 * update: profiles has no UPDATE policy on purpose, so a direct update would
 * silently match zero rows and report success while changing nothing.
 */
export async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { error: rpcError } = await supabase.rpc('nn_set_own_avatar', { p_path: path });
  if (rpcError) throw rpcError;

  cache.delete(path);
  return path;
}