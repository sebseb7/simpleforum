import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrateAuth } from '../store/authSlice.js';

/**
 * Restore JWT session only after mount/hydration commit.
 * Must not run before hydrateRoot finishes comparing to SSG HTML
 * (which is always anonymous).
 */
export default function AuthSessionBootstrap({ enabled = true }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return undefined;
    dispatch(hydrateAuth());
    return undefined;
  }, [dispatch, enabled]);

  return null;
}
