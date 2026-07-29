import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { openDatabase } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const dbPath = process.env.DATABASE_PATH || './server/data/romanum.sqlite';
const store = openDatabase(dbPath);

const arg = process.argv.slice(2).join(' ').trim();

function printUsers() {
  const users = store.users.listAll.all();
  if (users.length === 0) {
    console.log('No users in the database.');
    return;
  }
  console.log('Users:');
  for (const u of users) {
    const flag = u.is_admin ? 'admin' : 'user ';
    console.log(`  #${u.id}  [${flag}]  ${u.email}  (${u.name})`);
  }
  console.log('\nToggle with: npm run admin -- <email-or-id>');
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
  console.error(`User not found: ${arg}`);
  printUsers();
  process.exit(1);
}

const next = user.is_admin ? 0 : 1;
store.users.updateAdmin.run(next, user.id);
const updated = store.users.findById.get(user.id);

console.log(
  `${updated.email}: admin ${user.is_admin ? 'ON → OFF' : 'OFF → ON'}`,
);
console.log('(Log out and sign in again for the session to pick this up.)');
