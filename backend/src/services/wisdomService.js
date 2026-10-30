import { NotFoundError, ForbiddenError } from '../errors.js';
import { encodeEmbedding, decodeEmbedding } from '../embeddingCodec.js';

function rowToWisdom(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    category: row.category,
    ownerId: row.owner_id,
    embedding: decodeEmbedding(row.embedding),
    createdAt: row.created_at,
  };
}

/** Escapes a raw user query into an FTS5 MATCH expression of prefix terms. */
function toFtsQuery(raw) {
  const sanitized = raw.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  if (!sanitized) return '""';
  return sanitized
    .split(/\s+/)
    .map((term) => `"${term}"*`)
    .join(' ');
}

export class WisdomService {
  constructor(db, embeddingService) {
    this.db = db;
    this.embeddingService = embeddingService;
  }

  listVisible(userId) {
    const rows = this.db
      .prepare(
        'SELECT * FROM wisdom WHERE owner_id IS NULL OR owner_id = ? ORDER BY id DESC'
      )
      .all(userId);
    return rows.map(rowToWisdom);
  }

  fullTextSearch(query, userId) {
    const rows = this.db
      .prepare(
        `SELECT w.* FROM wisdom w JOIN wisdom_fts ON w.id = wisdom_fts.rowid
         WHERE wisdom_fts MATCH ? AND (w.owner_id IS NULL OR w.owner_id = ?)
         ORDER BY rank`
      )
      .all(toFtsQuery(query), userId);
    return rows.map(rowToWisdom);
  }

  get(id, userId) {
    const row = this.db
      .prepare('SELECT * FROM wisdom WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)')
      .get(id, userId);
    if (!row) throw new NotFoundError('Wisdom not found');
    return rowToWisdom(row);
  }

  getRandom(userId) {
    const row = this.db
      .prepare(
        'SELECT * FROM wisdom WHERE owner_id IS NULL OR owner_id = ? ORDER BY RANDOM() LIMIT 1'
      )
      .get(userId);
    if (!row) throw new NotFoundError('No wisdom available');
    return rowToWisdom(row);
  }

  findAllVisibleWithEmbeddings(userId) {
    return this.listVisible(userId);
  }

  findAllMissingEmbedding() {
    const rows = this.db.prepare('SELECT * FROM wisdom WHERE embedding IS NULL').all();
    return rows.map(rowToWisdom);
  }

  async create(text, author, category, userId) {
    const embedding = await this.embeddingService.embed(text);
    const info = this.db
      .prepare(
        'INSERT INTO wisdom (text, author, category, owner_id, embedding) VALUES (?, ?, ?, ?, ?)'
      )
      .run(text, author ?? null, category ?? null, userId, encodeEmbedding(embedding));
    return this.get(info.lastInsertRowid, userId);
  }

  async update(id, text, author, category, userId) {
    this.requireOwnership(id, userId);
    const embedding = await this.embeddingService.embed(text);
    this.db
      .prepare('UPDATE wisdom SET text = ?, author = ?, category = ?, embedding = ? WHERE id = ?')
      .run(text, author ?? null, category ?? null, encodeEmbedding(embedding), id);
    return this.get(id, userId);
  }

  delete(id, userId) {
    this.requireOwnership(id, userId);
    this.db.prepare('DELETE FROM wisdom WHERE id = ?').run(id);
  }

  updateEmbedding(id, embedding) {
    this.db.prepare('UPDATE wisdom SET embedding = ? WHERE id = ?').run(encodeEmbedding(embedding), id);
  }

  requireOwnership(id, userId) {
    // Existence + visibility check first, so a non-owner gets a 404 (private
    // wisdom is invisible to others) rather than a 403 that leaks existence.
    this.get(id, userId);
    const owned = this.db
      .prepare('SELECT 1 FROM wisdom WHERE id = ? AND owner_id = ?')
      .get(id, userId);
    if (!owned) {
      throw new ForbiddenError('You cannot edit wisdom you do not own');
    }
  }
}

export function toWisdomResponse(wisdom, currentUserId) {
  return {
    id: wisdom.id,
    text: wisdom.text,
    author: wisdom.author,
    category: wisdom.category,
    isOwn: wisdom.ownerId != null && wisdom.ownerId === currentUserId,
    createdAt: wisdom.createdAt,
  };
}
