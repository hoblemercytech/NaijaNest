import { useEffect, useMemo, useState } from 'react';
import { avatarUrl, avatarUrls } from '../lib/storage';

/**
 * Turns a stored storage path into a signed URL the browser can render. The
 * bucket is private, so passing `profile.avatar_url` straight to an <img> gives
 * a broken image — every avatar has to come through here.
 *
 * State keeps the path alongside its URL so the "nothing signed yet" case is
 * derived on the way out rather than pushed through setState in the effect.
 * That also stops a stale URL flashing when the path changes after an upload.
 */
export function useAvatarUrl(path) {
  const [signed, setSigned] = useState({ path: null, url: null });

  useEffect(() => {
    if (!path) return undefined;

    let alive = true;
    avatarUrl(path).then((url) => {
      if (alive) setSigned({ path, url });
    });

    return () => {
      alive = false;
    };
  }, [path]);

  return signed.path === path ? signed.url : null;
}


/**
 * Signs a whole list of avatar paths in one pass.
 *
 * A customer list can hold fifty rows. Signing per row would fire fifty
 * requests on every render, so paths are batched and the result is keyed by
 * path — `urls[person.avatar_url]` in the row, no per-item state.
 *
 * The key is the sorted path list rather than the array itself, so a re-render
 * that produces an equal-but-new array does not re-sign everything.
 */
export function useAvatarUrls(paths) {
  const key = useMemo(
    () => [...new Set((paths || []).filter(Boolean))].sort().join('|'),
    [paths]
  );
  const [signed, setSigned] = useState({ key: null, urls: {} });

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    avatarUrls(key.split('|')).then((urls) => {
      if (alive) setSigned({ key, urls });
    });
    return () => {
      alive = false;
    };
  }, [key]);

  return signed.key === key ? signed.urls : {};
}
