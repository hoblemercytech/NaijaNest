import { useEffect, useState } from 'react';
import { avatarUrl } from '../lib/storage';

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