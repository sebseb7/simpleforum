import compression from 'compression';

/** Gzip/deflate JSON and other compressible responses; skip SSE streams. */
export function compressionMiddleware() {
  return compression({
    threshold: 1024,
    filter(req, res) {
      if (req.originalUrl?.includes('/events')) return false;
      const type = res.getHeader('Content-Type');
      if (typeof type === 'string' && type.includes('text/event-stream')) return false;
      return compression.filter(req, res);
    },
  });
}

/**
 * Cache-Control for API responses.
 * GETs use no-cache so browsers/proxies revalidate with If-None-Match (ETag → 304).
 * Mutations and live streams must not be stored.
 */
export function cacheControlMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const path = req.originalUrl || req.url || '';

  if (path.includes('/events')) {
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Pragma', 'no-cache');
    return next();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // Auth endpoints and health stay fresh; still allow ETag revalidation on GETs.
  if (path.startsWith('/api/auth') || path.startsWith('/api/me') || path.startsWith('/api/health')) {
    res.setHeader('Cache-Control', 'private, no-cache');
    return next();
  }

  // Forum reads: revalidate every time; unchanged bodies return 304 via ETag.
  res.setHeader('Cache-Control', 'private, no-cache');
  next();
}
