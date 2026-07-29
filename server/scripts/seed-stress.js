import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { openDatabase } from '../src/db.js';
import { uniqueSlug } from '../../shared/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const dbPath = process.env.DATABASE_PATH || './server/data/romanum.sqlite';
const force = process.argv.includes('--force');

const USER_COUNT = 28;
const YEAR_DAYS = 365;

const EN_TITLES = [
  'Should cities ban private cars downtown?',
  'Universal basic income: experiment or fantasy?',
  'Is remote work killing office culture?',
  'Nuclear power in the climate toolkit',
  'Regulate AI training data?',
  'Four-day work week — productivity myth?',
  'Public transit vs highway expansion',
  'Meat taxes: fair climate policy?',
  'School phones: ban or trust?',
  'Open source AI models for everyone?',
  'Housing: rent caps or more building?',
  'Social media age gates — do they work?',
  'Space budgets vs earth problems',
  'Cashless society: convenience or trap?',
  'Term limits for all elected offices?',
  'Platform liability for user speech',
  'Gene editing crops without labels?',
  'Military spending after the last decade',
  'Should voting be mandatory?',
  'Gig work: employees or contractors?',
  'Daylight saving time — abolish it?',
  'City surveillance cameras: safety tradeoff',
  'College debt forgiveness fairness',
  'Electric cars without more grid capacity?',
  'Journalism paywalls and democracy',
  'Immigration quotas vs open labor markets',
  'Plastic bans that actually stick',
  'Esports as Olympic sport?',
  'Right to repair for phones and tractors',
  'Crypto after the hype cycle',
];

const DE_TITLES = [
  'Innenstädte autofrei — Utopie oder Pflicht?',
  'Bedingungsloses Grundeinkommen: Chance oder Falle?',
  'Homeoffice — Ende der Bürokultur?',
  'Kernkraft im Klimapaket?',
  'KI-Trainingsdaten streng regulieren?',
  'Vier-Tage-Woche: Produktivitätsmythos?',
  'ÖPNV ausbauen statt neue Autobahnen',
  'Fleischsteuer als Klimaschutz?',
  'Handys in der Schule verbieten?',
  'Open-Source-KI für alle?',
  'Mietpreisbremse oder mehr bauen?',
  'Altersgrenzen für Social Media',
  'Weltraumbudget vs Probleme auf der Erde',
  'Bargeldlose Gesellschaft: Komfort oder Falle?',
  'Amtszeitbegrenzung für alle Mandate?',
  'Plattformhaftung für Nutzerinhalte',
  'Gentechnik-Lebensmittel ohne Kennzeichnung?',
  'Verteidigungsetat nach dem letzten Jahrzehnt',
  'Wahlpflicht — ja oder nein?',
  'Gig-Arbeit: Arbeitnehmer oder Selbstständige?',
  'Sommerzeit abschaffen?',
  'Videoüberwachung in Städten',
  'Schuldenerlass für Studierende',
  'E-Autos ohne Netzausbau?',
  'Bezahlschranken und Demokratie',
  'Einwanderung: Quoten oder offene Märkte?',
  'Plastikverbote die halten',
  'E-Sport bei Olympia?',
  'Recht auf Reparatur',
  'Krypto nach dem Hype',
];

const EN_ANNOUNCE = [
  'Forum guidelines update',
  'Scheduled maintenance window',
  'Moderator recruitment open',
  'New section coming soon',
  'Code of conduct reminder',
  'Weekend debate marathon',
  'Feature: star your favorites',
  'Please report spam topics',
  'Language switcher tip',
  'Quarterly community survey',
  'Image upload etiquette',
  'Closed topics stay readable',
];

const DE_ANNOUNCE = [
  'Aktualisierte Forenregeln',
  'Geplante Wartung',
  'Moderatoren gesucht',
  'Neuer Bereich in Planung',
  'Erinnerung an den Verhaltenskodex',
  'Wochenend-Debattenmarathon',
  'Funktion: Themen mit Stern markieren',
  'Bitte Spam melden',
  'Tipp zur Sprachumschaltung',
  'Vierteljährliche Umfrage',
  'Bild-Upload: Bitte fair bleiben',
  'Geschlossene Themen bleiben lesbar',
];

const EN_REPLIES = [
  'I disagree with the premise — the data points the other way.',
  'Can someone cite a primary source for that claim?',
  'This ignores rural communities completely.',
  'Short-term pain, long-term gain. History agrees.',
  'Interesting take, but implementation details matter.',
  'We tried a lighter version locally and it flopped.',
  'The comparison to the 1990s is misleading.',
  'Agree on the goal, not on the mechanism.',
  'What about externalities you left out?',
  'Polling shows majority support, at least for now.',
  'This would hit low-income households hardest.',
  'Tech moves faster than regulators — plan for that.',
  'A pilot program first, then scale.',
  'Counterpoint: incentives beat bans.',
  'I changed my mind after reading the linked study.',
];

const DE_REPLIES = [
  'Ich widerspreche der Prämisse — die Daten zeigen etwas anderes.',
  'Bitte eine Primärquelle für diese Behauptung.',
  'Das ignoriert den ländlichen Raum völlig.',
  'Kurzfristig schmerzhaft, langfristig sinnvoll.',
  'Interessanter Punkt, aber die Umsetzung zählt.',
  'Wir haben lokal eine leichtere Variante getestet — ohne Erfolg.',
  'Der Vergleich mit den 90ern hinkt.',
  'Ziel ja, Mittel nein.',
  'Welche Externalitäten fehlen in der Rechnung?',
  'Umfragen zeigen derzeit eine Mehrheit.',
  'Das würde Haushalte mit geringem Einkommen am stärksten treffen.',
  'Technik ist schneller als Regulierung — darauf planen.',
  'Erst Pilotprojekt, dann skalieren.',
  'Gegenargument: Anreize schlagen Verbote.',
  'Nach der verlinkten Studie habe ich meine Meinung geändert.',
];

const NAMES = [
  'Alex Rivera', 'Blake Chen', 'Casey Nguyen', 'Dana Okonkwo', 'Ellis Berg',
  'Frankie Silva', 'Gray Patel', 'Harper Díaz', 'Indie Walsh', 'Jordan Kim',
  'Kai Müller', 'Logan Freitag', 'Morgan Schulz', 'Noa Richter', 'Oakley Braun',
  'Parker Vogel', 'Quinn Hartmann', 'Reese Keller', 'Sage Neumann', 'Taylor Brandt',
  'Uma Schneider', 'Riley Haas', 'Sam Fischer', 'Tony Weber', 'Val Ortega',
  'Wren Soto', 'Yael Cohen', 'Zion Park',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatSqliteDate(date) {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

function daysAgo(from, dayOffset, hour = 12, minute = 0) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - dayOffset);
  d.setUTCHours(hour, minute, (dayOffset * 7) % 60, 0);
  return d;
}

function pick(list, i) {
  return list[i % list.length];
}

function bodyHtml(lang, seed, long = false) {
  const lines = lang === 'de' ? DE_REPLIES : EN_REPLIES;
  const a = pick(lines, seed);
  const b = pick(lines, seed + 3);
  const c = pick(lines, seed + 7);
  const d = pick(lines, seed + 11);
  const e = pick(lines, seed + 13);
  const f = pick(lines, seed + 17);
  const g = pick(lines, seed + 19);
  const linkLabel = lang === 'de' ? 'Beispielquelle' : 'example source';
  const imgAlt = lang === 'de' ? 'Beispielbild' : 'sample image';
  const imgSrc = `https://picsum.photos/seed/romanum${seed % 1000}/320/180`;

  // Every Quill format we allow: headers, inline marks, align, blockquote,
  // ordered/bullet lists + indent, link, image.
  const rich = [
    `<h1>${a}</h1>`,
    `<h2>${b}</h2>`,
    `<h3>${c}</h3>`,
    `<p><strong>${d}</strong> <em>${e}</em> <u>${f}</u> <s>${g}</s></p>`,
    `<p class="ql-align-center">${pick(lines, seed + 23)}</p>`,
    `<p class="ql-align-right">${pick(lines, seed + 29)}</p>`,
    `<p class="ql-align-justify">${pick(lines, seed + 31)}</p>`,
    `<blockquote><p>${pick(lines, seed + 37)}</p></blockquote>`,
    `<ol><li>${pick(lines, seed + 41)}</li><li class="ql-indent-1">${pick(lines, seed + 43)}</li></ol>`,
    `<ul><li>${pick(lines, seed + 47)}</li><li class="ql-indent-1">${pick(lines, seed + 53)}</li></ul>`,
    `<p><a href="https://example.com/debate/${seed}" rel="noopener noreferrer" target="_blank">${linkLabel}</a></p>`,
    `<p><img src="${imgSrc}" alt="${imgAlt}" width="320" height="180"></p>`,
  ];

  if (long) return rich.join('');

  // Short bodies: always a paragraph, plus one rotating format so the seed
  // corpus covers the full Quill surface over many posts.
  const accent = rich[seed % rich.length];
  return `<p>${a}</p>${accent}`;
}

function replyCountForIndex(i) {
  if (i % 37 === 0) return 280 + (i % 90); // ~280–369
  if (i % 17 === 0) return 120 + (i % 80); // ~120–199
  if (i % 7 === 0) return 40 + (i % 40); // ~40–79
  return i % 12; // 0–11
}

function ensureSections(store) {
  const sections = store.sections.list.all();
  const found = {
    enDebate: sections.find((s) => s.lang === 'en' && !s.admin_only_topics),
    enAnnounce: sections.find((s) => s.lang === 'en' && !!s.admin_only_topics),
    deDebate: sections.find((s) => s.lang === 'de' && !s.admin_only_topics),
    deAnnounce: sections.find((s) => s.lang === 'de' && !!s.admin_only_topics),
  };
  for (const [key, value] of Object.entries(found)) {
    if (!value) {
      throw new Error(`Missing section for ${key}. Start the app once to seed base sections.`);
    }
  }
  return found;
}

function clearStressData(db) {
  const stressIds = db
    .prepare("SELECT id FROM users WHERE google_sub LIKE 'stress:%'")
    .all()
    .map((r) => r.id);
  if (stressIds.length === 0) return 0;

  const placeholders = stressIds.map(() => '?').join(',');
  const topicIds = db
    .prepare(`SELECT id FROM topics WHERE author_id IN (${placeholders})`)
    .all(...stressIds)
    .map((r) => r.id);

  const run = db.transaction(() => {
    db.prepare(`DELETE FROM stars WHERE user_id IN (${placeholders})`).run(...stressIds);
    db.prepare(`DELETE FROM posts WHERE author_id IN (${placeholders})`).run(...stressIds);

    for (const tid of topicIds) {
      const postIds = db
        .prepare('SELECT id FROM posts WHERE topic_id = ?')
        .all(tid)
        .map((r) => r.id);
      for (const pid of postIds) {
        db.prepare(
          "DELETE FROM stars WHERE target_type = 'post' AND target_id = ?",
        ).run(pid);
      }
      db.prepare("DELETE FROM stars WHERE target_type = 'topic' AND target_id = ?").run(tid);
      db.prepare('DELETE FROM posts WHERE topic_id = ?').run(tid);
      db.prepare('DELETE FROM topics WHERE id = ?').run(tid);
    }

    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...stressIds);
  });
  run();
  return stressIds.length;
}

function seedSectionTopics({
  db,
  insertTopic,
  insertPost,
  insertStar,
  userIds,
  adminId,
  debateId,
  announceId,
  titles,
  announceTitles,
  lang,
  topicCount,
  announceCount,
  now,
  usedSlugs,
}) {
  let totalPosts = 0;
  let totalTopics = 0;

  for (let i = 0; i < topicCount; i++) {
    const dayOffset = Math.floor((i / Math.max(topicCount - 1, 1)) * (YEAR_DAYS - 1));
    const created = daysAgo(now, YEAR_DAYS - 1 - dayOffset, 8 + (i % 10), (i * 3) % 60);
    const authorId = userIds[i % userIds.length];
    const title = `${pick(titles, i)} (#${i + 1})`;
    const slug = uniqueSlug(title, (s) => usedSlugs.has(s));
    usedSlugs.add(slug);
    const replies = replyCountForIndex(i);
    const closed = i % 23 === 0 ? 1 : 0;
    const span = Math.max(1, Math.min(45, Math.floor(replies / 4) + 1));
    const updatedOffset = Math.max(0, YEAR_DAYS - 1 - dayOffset - span);
    const updated = daysAgo(now, updatedOffset, 14 + (i % 8), (i * 5) % 60);

    const topicResult = insertTopic.run(
      debateId,
      title,
      slug,
      bodyHtml(lang, i, i % 4 === 0),
      authorId,
      closed,
      formatSqliteDate(created),
      formatSqliteDate(updated),
    );
    const topicId = topicResult.lastInsertRowid;
    totalTopics += 1;

    const startMs = created.getTime();
    const endMs = Math.max(startMs, updated.getTime());

    for (let r = 0; r < replies; r++) {
      const replyAuthor = userIds[(i + r + 1) % userIds.length];
      const progress = replies <= 1 ? 0 : r / (replies - 1);
      const replyDate = new Date(startMs + progress * (endMs - startMs));
      const postResult = insertPost.run(
        topicId,
        bodyHtml(lang, i * 100 + r, r % 11 === 0),
        replyAuthor,
        formatSqliteDate(replyDate),
      );
      totalPosts += 1;
      if (r % 29 === 0) {
        insertStar.run(
          userIds[(r + 2) % userIds.length],
          'post',
          postResult.lastInsertRowid,
          formatSqliteDate(replyDate),
        );
      }
    }

    if (i % 5 === 0) {
      insertStar.run(
        userIds[(i + 3) % userIds.length],
        'topic',
        topicId,
        formatSqliteDate(updated),
      );
    }
  }

  for (let i = 0; i < announceCount; i++) {
    const dayOffset = Math.floor((i / Math.max(announceCount - 1, 1)) * (YEAR_DAYS - 1));
    const created = daysAgo(now, YEAR_DAYS - 1 - dayOffset, 10, i);
    const title = pick(announceTitles, i);
    const slug = uniqueSlug(title, (s) => usedSlugs.has(s));
    usedSlugs.add(slug);
    insertTopic.run(
      announceId,
      title,
      slug,
      bodyHtml(lang, 900 + i, true),
      adminId,
      0,
      formatSqliteDate(created),
      formatSqliteDate(created),
    );
    totalTopics += 1;
  }

  return { totalTopics, totalPosts };
}

function seedStress(store) {
  const db = store.db;
  const sections = ensureSections(store);
  const now = new Date();

  const insertUser = db.prepare(`
    INSERT INTO users (google_sub, email, name, picture, hide_avatar, is_admin)
    VALUES (?, ?, ?, NULL, ?, 0)
  `);
  const insertTopic = db.prepare(`
    INSERT INTO topics (section_id, title, slug, body_html, author_id, is_closed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const usedSlugs = new Set(
    db.prepare('SELECT slug FROM topics').all().map((r) => r.slug).filter(Boolean),
  );
  const insertPost = db.prepare(`
    INSERT INTO posts (topic_id, body_html, author_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const insertStar = db.prepare(`
    INSERT OR IGNORE INTO stars (user_id, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?)
  `);

  return db.transaction(() => {
    const userIds = [];
    for (let i = 0; i < USER_COUNT; i++) {
      const result = insertUser.run(
        `stress:${i + 1}`,
        `stress${i + 1}@example.test`,
        NAMES[i] || `Debater ${i + 1}`,
        i % 5 === 0 ? 1 : 0,
      );
      userIds.push(result.lastInsertRowid);
    }

    const adminId =
      db.prepare('SELECT id FROM users WHERE is_admin = 1 ORDER BY id LIMIT 1').get()?.id ||
      userIds[0];

    const shared = {
      db,
      insertTopic,
      insertPost,
      insertStar,
      userIds,
      adminId,
      now,
      usedSlugs,
    };

    const en = seedSectionTopics({
      ...shared,
      debateId: sections.enDebate.id,
      announceId: sections.enAnnounce.id,
      titles: EN_TITLES,
      announceTitles: EN_ANNOUNCE,
      lang: 'en',
      topicCount: 90,
      announceCount: 14,
    });
    const de = seedSectionTopics({
      ...shared,
      debateId: sections.deDebate.id,
      announceId: sections.deAnnounce.id,
      titles: DE_TITLES,
      announceTitles: DE_ANNOUNCE,
      lang: 'de',
      topicCount: 75,
      announceCount: 12,
    });

    return {
      users: userIds.length,
      enTopics: en.totalTopics,
      enPosts: en.totalPosts,
      deTopics: de.totalTopics,
      dePosts: de.totalPosts,
    };
  })();
}

const store = openDatabase(dbPath);
const existing = store.db
  .prepare("SELECT COUNT(*) AS n FROM users WHERE google_sub LIKE 'stress:%'")
  .get().n;

if (existing > 0 && !force) {
  console.log(
    `Stress data already present (${existing} users). Re-run with --force to replace it.`,
  );
  console.log('  npm run seed:stress -- --force');
  process.exit(0);
}

if (force && existing > 0) {
  const removed = clearStressData(store.db);
  console.log(`Cleared previous stress users: ${removed}`);
}

console.log('Seeding year-long debate stress data…');
const stats = seedStress(store);
console.log('Done.');
console.log(
  `  users=${stats.users}  en topics/posts=${stats.enTopics}/${stats.enPosts}  de topics/posts=${stats.deTopics}/${stats.dePosts}`,
);
console.log(
  `  totals topics=${store.db.prepare('SELECT COUNT(*) n FROM topics').get().n} posts=${store.db.prepare('SELECT COUNT(*) n FROM posts').get().n}`,
);

const heavy = store.db
  .prepare(
    `SELECT t.id, t.title, COUNT(p.id) AS replies
     FROM topics t
     LEFT JOIN posts p ON p.topic_id = t.id
     GROUP BY t.id
     HAVING replies >= 100
     ORDER BY replies DESC
     LIMIT 8`,
  )
  .all();
console.log('  heaviest threads:');
for (const row of heavy) {
  console.log(`    #${row.id}  ${row.replies} replies  ${row.title.slice(0, 60)}`);
}
