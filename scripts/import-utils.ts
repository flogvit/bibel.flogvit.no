import crypto from 'crypto';
import Database from 'better-sqlite3';

/**
 * Compute SHA256 hash of content
 */
export function computeHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if content has changed by comparing hashes
 */
export function hasContentChanged(
  db: Database.Database,
  contentType: string,
  contentKey: string,
  newHash: string
): boolean {
  const existing = db.prepare(
    'SELECT content_hash FROM content_hashes WHERE content_type = ? AND content_key = ?'
  ).get(contentType, contentKey) as { content_hash: string } | undefined;
  return !existing || existing.content_hash !== newHash;
}

/**
 * Update the content hash in database
 */
export function updateContentHash(
  db: Database.Database,
  contentType: string,
  contentKey: string,
  hash: string
): void {
  db.prepare(`
    INSERT OR REPLACE INTO content_hashes (content_type, content_key, content_hash, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(contentType, contentKey, hash, new Date().toISOString());
}

/**
 * Get all content hashes of a specific type
 */
export function getContentHashes(
  db: Database.Database,
  contentType: string
): Map<string, { hash: string; updatedAt: string }> {
  const rows = db.prepare(
    'SELECT content_key, content_hash, updated_at FROM content_hashes WHERE content_type = ?'
  ).all(contentType) as { content_key: string; content_hash: string; updated_at: string }[];

  const map = new Map<string, { hash: string; updatedAt: string }>();
  for (const row of rows) {
    map.set(row.content_key, { hash: row.content_hash, updatedAt: row.updated_at });
  }
  return map;
}

/**
 * Get sync version from database
 */
export function getSyncVersion(db: Database.Database): number {
  const row = db.prepare(
    "SELECT value FROM db_meta WHERE key = 'sync_version'"
  ).get() as { value: string } | undefined;
  return row ? parseInt(row.value, 10) : 0;
}

/**
 * Increment sync version
 */
export function incrementSyncVersion(db: Database.Database): number {
  const currentVersion = getSyncVersion(db);
  const newVersion = currentVersion + 1;
  db.prepare(
    "INSERT OR REPLACE INTO db_meta (key, value) VALUES ('sync_version', ?)"
  ).run(String(newVersion));
  return newVersion;
}

/**
 * Create the content_hashes table if it doesn't exist
 */
export function createContentHashesTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_hashes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_key TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (content_type, content_key)
    );
    CREATE INDEX IF NOT EXISTS idx_content_hashes_type ON content_hashes(content_type);
    CREATE INDEX IF NOT EXISTS idx_content_hashes_updated ON content_hashes(updated_at);
  `);
}

/**
 * Get changed content keys since a given sync version
 * Returns content that was updated after the version was set
 */
export function getChangedContentSince(
  db: Database.Database,
  contentType: string,
  sinceVersion: number
): string[] {
  // Get the timestamp when the sinceVersion was set
  // If sinceVersion is 0, return all content
  if (sinceVersion === 0) {
    const rows = db.prepare(
      'SELECT content_key FROM content_hashes WHERE content_type = ?'
    ).all(contentType) as { content_key: string }[];
    return rows.map(r => r.content_key);
  }

  // Find content updated after the sync version was incremented
  // This requires tracking when each sync_version was created
  // For simplicity, we compare updated_at with the version record
  const versionRow = db.prepare(
    "SELECT value FROM db_meta WHERE key = 'version_' || ?"
  ).get(sinceVersion) as { value: string } | undefined;

  if (!versionRow) {
    // Version not found, return all content updated
    const rows = db.prepare(
      'SELECT content_key FROM content_hashes WHERE content_type = ?'
    ).all(contentType) as { content_key: string }[];
    return rows.map(r => r.content_key);
  }

  const sinceTimestamp = versionRow.value;
  const rows = db.prepare(
    'SELECT content_key FROM content_hashes WHERE content_type = ? AND updated_at > ?'
  ).all(contentType, sinceTimestamp) as { content_key: string }[];
  return rows.map(r => r.content_key);
}
