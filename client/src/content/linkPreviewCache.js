/** In-memory dedupe for concurrent / repeated link-preview requests. */
const cache = new Map();
const inflight = new Map();

/**
 * @param {string} url
 * @param {() => Promise<{ preview: object }>} fetcher
 */
export function loadLinkPreview(url, fetcher) {
  const key = String(url);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);

  const p = fetcher()
    .then((data) => {
      cache.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p);
  return p;
}
