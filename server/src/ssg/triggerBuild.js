import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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

function runBuild() {
  running = true;
  dirty = false;
  console.log('SSG: starting npm run build…');
  const child = spawn('npm', ['run', 'build'], {
    cwd: ROOT,
    env: { ...process.env, SSG_REBUILD: '0' }, // prevent nested rebuild triggers
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    console.error('SSG: build spawn failed', err);
    running = false;
    if (dirty) scheduleRebuild();
  });

  child.on('exit', (code) => {
    running = false;
    if (code === 0) {
      console.log('SSG: build finished');
    } else {
      console.error(`SSG: build exited with code ${code}`);
    }
    if (dirty) scheduleRebuild();
  });
}

/**
 * Debounced full `npm run build` after content mutations.
 * Coalesces bursts; runs at most one build at a time; re-runs if dirty.
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
    runBuild();
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
  'post.created',
  'post.updated',
  'post.deleted',
  'star.changed',
  'account.deleted',
  'user.updated',
]);

export function scheduleRebuildForEvent(event) {
  if (event && REBUILD_TYPES.has(event.type)) {
    scheduleRebuild();
  }
}
