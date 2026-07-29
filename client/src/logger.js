/**
 * Browser-side logger (no chalk — Node ANSI colors don't apply in DevTools).
 * Mirrors server severity + ISO time for consistency.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function minLevel() {
  try {
    const raw = String(
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_LEVEL) ||
        'warn',
    ).toLowerCase();
    return LEVELS[raw] ?? LEVELS.warn;
  } catch {
    return LEVELS.warn;
  }
}

function write(level, scope, args) {
  if ((LEVELS[level] ?? 99) < minLevel()) return;
  const prefix = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)}${scope ? ` [${scope}]` : ''}`;
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;
  fn(prefix, ...args);
}

export function createLogger(scope = '') {
  return {
    debug: (...args) => write('debug', scope, args),
    info: (...args) => write('info', scope, args),
    warn: (...args) => write('warn', scope, args),
    error: (...args) => write('error', scope, args),
    child(childScope) {
      const next = scope ? `${scope}:${childScope}` : String(childScope || '');
      return createLogger(next);
    },
  };
}

export const log = createLogger();
export default log;
