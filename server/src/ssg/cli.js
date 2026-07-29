import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { openDatabase } from '../db.js';
import { prerenderAll } from './prerender.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

for (const key of Object.keys(process.env)) {
  if (process.env[key] === '') delete process.env[key];
}
dotenv.config({ path: path.join(root, '.env'), quiet: true });

const dbPath = process.env.DATABASE_PATH || './server/data/romanum.sqlite';
const store = openDatabase(dbPath);

try {
  await prerenderAll(store, { rootDir: root });
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
