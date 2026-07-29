import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrateAuth } from '../store/authSlice.js';
import { fetchSettings } from '../store/sectionsSlice.js';

/**
 * Restore JWT session only after mount/hydration commit.
 * Must not run before hydrateRoot finishes comparing to SSG HTML
 * (which is always anonymous).
 * Also loads site settings (site name) for brand + DocumentMeta.
 */
export default function AuthSessionBootstrap({ enabled = true }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return undefined;
    dispatch(hydrateAuth());
    dispatch(fetchSettings());
    return undefined;
  }, [dispatch, enabled]);

  return null;
}
