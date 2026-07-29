import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { openDatabase } from '../src/db.js';
import { createLogger } from '../src/logger.js';

const log = createLogger('admin');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const dbPath = process.env.DATABASE_PATH || './server/data/romanum.sqlite';
const store = openDatabase(dbPath);

const arg = process.argv.slice(2).join(' ').trim();

function printUsers() {
  const users = store.users.listAll.all();
  if (users.length === 0) {
    log.info('No users in the database.');
    return;
  }
  log.info('Users:');
  for (const u of users) {
    const flag = u.is_admin ? 'admin' : 'user ';
    log.info(`  #${u.id}  [${flag}]  ${u.email}  (${u.name})`);
  }
  log.info('Toggle with: npm run admin -- <email-or-id>');
}

if (!arg) {
  printUsers();
  process.exit(0);
}

const byId = /^\d+$/.test(arg) ? store.users.findById.get(Number(arg)) : null;
const email = arg.toLowerCase();
const user =
  byId ||
  store.users.listAll.all().find((u) => u.email.toLowerCase() === email);

if (!user) {
  log.error(`User not found: ${arg}`);
  printUsers();
  process.exit(1);
}

const next = user.is_admin ? 0 : 1;
store.users.updateAdmin.run(next, user.id);
const updated = store.users.findById.get(user.id);

log.info(
  `${updated.email}: admin ${user.is_admin ? 'ON → OFF' : 'OFF → ON'}`,
);
log.info('(Log out and sign in again for the session to pick this up.)');
