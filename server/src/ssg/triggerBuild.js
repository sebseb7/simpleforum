import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

const DEBOUNCE_MS = Number(process.env.SSG_REBUILD_DEBOUNCE_MS) || 1500;

let timer = null;
let running = false;
let dirty = false;

function enabled() {
  const v = process.env.SSG_REBUILD;
  if (v === '0' || v === 'false') return false;
  return true;
}

/**
 * Content mutations only need HTML prerender — not a full Vite client/SSR rebuild.
 * Requires an existing dist-ssr/entry-server.js + client-template.html from a prior
 * `npm run build` / `build:client` + `build:ssr`.
 */
function runSsg() {
  running = true;
  dirty = false;
  log.info('starting npm run ssg…');

  // Vite/picocolors/chalk disable color when stdout is not a TTY (pm2 pipes).
  const env = {
    ...process.env,
    SSG_REBUILD: '0', // prevent nested rebuild triggers from broadcast→ssg side effects
    FORCE_COLOR: '3',
    CLICOLOR_FORCE: '1',
  };
  delete env.NO_COLOR;

  const child = spawn('npm', ['run', 'ssg'], {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    log.error('ssg spawn failed', err);
    running = false;
    if (dirty) scheduleRebuild();
  });

  child.on('exit', (code) => {
    running = false;
    if (code === 0) {
      log.info('ssg finished');
    } else {
      log.error(`ssg exited with code ${code}`);
    }
    if (dirty) scheduleRebuild();
  });
}

/**
 * Debounced `npm run ssg` after content mutations.
 * Coalesces bursts; runs at most one pass at a time; re-runs if dirty.
 */
export function scheduleRebuild() {
  if (!enabled()) return;
  dirty = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (running) {
      dirty = true;
      return;
    }
    runSsg();
  }, DEBOUNCE_MS);
}

/** Content-affecting SSE event types that should refresh SSG HTML. */
const REBUILD_TYPES = new Set([
  'section.created',
  'section.updated',
  'topic.created',
  'topic.updated',
  'topic.deleted',
  'topic.closed',
  'topic.pinned',
  'post.created',
  'post.updated',
  'post.deleted',
  'star.changed',
  'settings.updated',
  'account.deleted',
  'user.updated',
]);

export function scheduleRebuildForEvent(event) {
  if (event && REBUILD_TYPES.has(event.type)) {
    scheduleRebuild();
  }
}
