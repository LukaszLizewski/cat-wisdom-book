import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SEED_WISDOM } from './seedWisdom.js';

/**
 * Opens (creating if needed) the SQLite database, applies the schema, and
 * re-syncs the built-in "system" wisdom rows (owner_id IS NULL). All
 * statements are idempotent so this can safely run on every startup -
 * mirrors the previous Java backend's schema.sql / data.sql behavior.
 */
export function openDatabase(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'cats-book.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name  TEXT NOT NULL UNIQUE,
      pin_hash      TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Wisdom entries. owner_id NULL means "system wisdom", visible to everyone.
    CREATE TABLE IF NOT EXISTS wisdom (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      text        TEXT NOT NULL,
      author      TEXT,
      category    TEXT,
      owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      embedding   BLOB,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_wisdom_owner ON wisdom(owner_id);

    -- Opaque bearer session tokens (custom lightweight auth, no JWT/OAuth).
    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- Full-text search over wisdom text/author/category.
    CREATE VIRTUAL TABLE IF NOT EXISTS wisdom_fts USING fts5(
      text, author, category, content='wisdom', content_rowid='id'
    );
  `);

  // Recreate the sync triggers on every startup (DROP+CREATE is idempotent
  // and cheap) so schema changes to the trigger bodies always take effect.
  db.exec(`
    DROP TRIGGER IF EXISTS wisdom_ai;
    CREATE TRIGGER wisdom_ai AFTER INSERT ON wisdom BEGIN
      INSERT INTO wisdom_fts(rowid, text, author, category)
      VALUES (new.id, new.text, new.author, new.category);
    END;

    DROP TRIGGER IF EXISTS wisdom_ad;
    CREATE TRIGGER wisdom_ad AFTER DELETE ON wisdom BEGIN
      INSERT INTO wisdom_fts(wisdom_fts, rowid, text, author, category)
      VALUES('delete', old.id, old.text, old.author, old.category);
    END;

    DROP TRIGGER IF EXISTS wisdom_au;
    CREATE TRIGGER wisdom_au AFTER UPDATE ON wisdom BEGIN
      INSERT INTO wisdom_fts(wisdom_fts, rowid, text, author, category)
      VALUES('delete', old.id, old.text, old.author, old.category);
      INSERT INTO wisdom_fts(rowid, text, author, category)
      VALUES (new.id, new.text, new.author, new.category);
    END;
  `);

  reseedSystemWisdom(db);

  return db;
}

function reseedSystemWisdom(db) {
  const deleteSystemWisdom = db.prepare('DELETE FROM wisdom WHERE owner_id IS NULL');
  const insertWisdom = db.prepare(
    "INSERT INTO wisdom (text, author, category, owner_id) VALUES (?, NULL, 'General', NULL)"
  );
  const reseed = db.transaction((rows) => {
    deleteSystemWisdom.run();
    for (const text of rows) {
      insertWisdom.run(text);
    }
  });
  reseed(SEED_WISDOM);
}
