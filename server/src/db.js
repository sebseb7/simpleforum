import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, '../sql');

function parseNamedQueries(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parts = raw.split(/--\s*name:\s*(\w+)/);
  const queries = {};
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i];
    const sql = parts[i + 1].trim();
    if (name && sql) queries[name] = sql;
  }
  return queries;
}

function prepareQueryFile(db, fileName) {
  const filePath = path.join(sqlDir, 'queries', fileName);
  const named = parseNamedQueries(filePath);
  const prepared = {};
  for (const [name, sql] of Object.entries(named)) {
    prepared[name] = db.prepare(sql);
  }
  return prepared;
}

export function openDatabase(databasePath) {
  const resolved = path.isAbsolute(databasePath)
    ? databasePath
    : path.resolve(process.cwd(), databasePath);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(sqlDir, 'schema.sql'), 'utf8');
  db.exec(schema);

  return {
    db,
    users: prepareQueryFile(db, 'users.sql'),
    sections: prepareQueryFile(db, 'sections.sql'),
    topics: prepareQueryFile(db, 'topics.sql'),
    posts: prepareQueryFile(db, 'posts.sql'),
    stars: prepareQueryFile(db, 'stars.sql'),
  };
}
