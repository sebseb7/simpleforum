import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../server/src/logger.js';

const log = createLogger('e2e');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../server/data');

export default async function globalSetup() {
  fs.mkdirSync(dataDir, { recursive: true });
  // Best-effort cleanup of previous e2e DBs (ignore locks)
  for (const name of fs.readdirSync(dataDir)) {
    if (!name.startsWith('romanum-e2e')) continue;
    try {
      fs.unlinkSync(path.join(dataDir, name));
    } catch {
      // ignore locked files from prior runs
    }
  }
  log.info('data dir ready', dataDir);
}
