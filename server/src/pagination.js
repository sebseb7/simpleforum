const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse offset/limit window query params.
 * @returns {{ offset: number, limit: number }}
 */
export function parseWindow(query, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const rawLimit = Number(query?.limit);
  const rawOffset = Number(query?.offset);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;
  return { offset, limit };
}

export function windowMeta(total, offset, limit) {
  return {
    total: Number(total) || 0,
    offset,
    limit,
  };
}
