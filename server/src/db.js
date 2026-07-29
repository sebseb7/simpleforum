import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { createLogger } from './logger.js';

const log = createLogger('db');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, '../sql');

/** Log named SQL statements slower than this (ms). */
const SLOW_SQL_MS = Number(process.env.SLOW_SQL_MS) || 2;

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

function wrapStatement(stmt, label) {
  const timed = (method) => (...args) => {
    const started = performance.now();
    try {
      return stmt[method](...args);
    } finally {
      const ms = performance.now() - started;
      if (ms >= SLOW_SQL_MS) {
        log.warn(`slow sql ${ms.toFixed(2)}ms [${label}]`);
      }
    }
  };
  return {
    get: timed('get'),
    all: timed('all'),
    run: timed('run'),
    iterate: timed('iterate'),
  };
}

function prepareQueryFile(db, fileName) {
  const filePath = path.join(sqlDir, 'queries', fileName);
  const named = parseNamedQueries(filePath);
  const ns = path.basename(fileName, '.sql');
  const prepared = {};
  for (const [name, sql] of Object.entries(named)) {
    prepared[name] = wrapStatement(db.prepare(sql), `${ns}.${name}`);
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
  migrateSchema(db);

  // Playwright uses empty isolated DBs; skip demo content there.
  if (!process.env.E2E_AUTH_SECRET) {
    seedInitialContent(db);
  }

  return {
    db,
    users: prepareQueryFile(db, 'users.sql'),
    sections: prepareQueryFile(db, 'sections.sql'),
    topics: prepareQueryFile(db, 'topics.sql'),
    posts: prepareQueryFile(db, 'posts.sql'),
    stars: prepareQueryFile(db, 'stars.sql'),
    settings: prepareQueryFile(db, 'settings.sql'),
    rootTopics: prepareQueryFile(db, 'rootTopics.sql'),
  };
}

function migrateSchema(db) {
  const topicCols = new Set(
    db.prepare('PRAGMA table_info(topics)').all().map((c) => c.name),
  );
  if (!topicCols.has('is_pinned')) {
    db.exec(
      'ALTER TABLE topics ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0',
    );
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS root_topics (
      lang TEXT PRIMARY KEY CHECK (lang IN ('en', 'de')),
      title TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      author_id INTEGER REFERENCES users(id),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Drop legacy slug-based welcome settings (content now lives in root_topics).
  db.prepare("DELETE FROM site_settings WHERE key IN ('welcome_topic_de', 'welcome_topic_en')").run();
}

function seedInitialContent(db) {
  const sectionCount = db.prepare('SELECT COUNT(*) AS n FROM sections').get().n;
  if (sectionCount > 0) return;

  const seed = db.transaction(() => {
    let author = db.prepare("SELECT id FROM users WHERE google_sub = 'system:seed'").get();
    if (!author) {
      const result = db
        .prepare(
          `INSERT INTO users (google_sub, email, name, picture, hide_avatar, is_admin)
           VALUES ('system:seed', 'seed@quixpos.local', 'QuixPOS', NULL, 0, 1)`,
        )
        .run();
      author = { id: result.lastInsertRowid };
    }

    const insertSection = db.prepare(`
      INSERT INTO sections (title, slug, description, lang, admin_only_topics, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTopic = db.prepare(`
      INSERT INTO topics (section_id, title, slug, body_html, author_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const enDebate = insertSection.run(
      'General Debate English',
      'general-debate-english',
      'Open topics for everyone',
      'en',
      0,
      0,
      author.id,
    );
    insertSection.run(
      'Announcements English',
      'announcements-english',
      'Admin opens topics',
      'en',
      1,
      1,
      author.id,
    );
    const deDebate = insertSection.run(
      'Allgemein - Deutsch',
      'allgemein-deutsch',
      'Offene Themen für alle',
      'de',
      0,
      0,
      author.id,
    );
    insertSection.run(
      'Ankündigungen - Deutsch',
      'ankuendigungen-deutsch',
      'Admins eröffnen Themen',
      'de',
      1,
      1,
      author.id,
    );

    insertTopic.run(
      enDebate.lastInsertRowid,
      'Welcome',
      'welcome',
      '<p>Debate starts here.</p>',
      author.id,
    );
    insertTopic.run(
      deDebate.lastInsertRowid,
      'Willkommen',
      'willkommen',
      '<p>Die Debatte beginnt hier.</p>',
      author.id,
    );
  });

  seed();
}
