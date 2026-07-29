import { Chalk } from 'chalk';

/**
 * PM2 / pipes are not TTYs, so default chalk disables color (level 0).
 * Force ANSI unless LOG_COLOR=0 (ignore ambient NO_COLOR — common under pm2/CI).
 *
 * Env:
 *   LOG_COLOR=0|false         → no color
 *   LOG_COLOR / FORCE_COLOR=1|2|3 → chalk color level (default 3)
 */
function createChalk() {
  if (process.env.LOG_COLOR === '0' || process.env.LOG_COLOR === 'false') {
    return new Chalk({ level: 0 });
  }
  const raw = process.env.LOG_COLOR ?? process.env.FORCE_COLOR ?? '3';
  const level = Math.min(3, Math.max(1, Number(raw) || 3));
  return new Chalk({ level });
}

const chalk = createChalk();

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_STYLE = {
  debug: chalk.magenta,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red.bold,
};

function resolveMinLevel() {
  const raw = String(process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] ?? LEVELS.info;
}

function formatTime(date = new Date()) {
  return date.toISOString();
}

function formatArg(arg) {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

/**
 * Central logger: ISO time + severity + optional scope, chalk-colored.
 *
 * Env: LOG_LEVEL=debug|info|warn|error (default info)
 *      LOG_COLOR=0 to disable ANSI; otherwise colors are forced (for pm2/pipes).
 */
export function createLogger(scope = '') {
  const label = String(scope || '').trim();

  function write(level, args) {
    if ((LEVELS[level] ?? 99) < resolveMinLevel()) return;

    const style = LEVEL_STYLE[level] || chalk.white;
    const time = chalk.gray(formatTime());
    const sev = style(level.toUpperCase().padEnd(5));
    const scopePart = label ? chalk.bold.dim(`[${label}]`) + ' ' : '';
    const message = args.map(formatArg).join(' ');

    const line = `${time} ${sev} ${scopePart}${message}`;
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug: (...args) => write('debug', args),
    info: (...args) => write('info', args),
    warn: (...args) => write('warn', args),
    error: (...args) => write('error', args),
    child(childScope) {
      const next = label ? `${label}:${childScope}` : String(childScope || '');
      return createLogger(next);
    },
  };
}

/** Default app logger (no scope). */
export const log = createLogger();

export default log;
