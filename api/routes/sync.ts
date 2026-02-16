/**
 * Sync routes: main sync endpoint, user bible sync.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../lib/mysql.js';

export const syncRouter = Router();

// Simple in-memory rate limiter per user
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// All sync routes require authentication
syncRouter.use(requireAuth);

interface SyncChange {
  dataType: string;
  itemId: string;
  data: any;
  updatedAt: number;
  deleted?: boolean;
}

/**
 * Merge reading plan progress: completedDays as union of both sides.
 */
function mergeReadingPlanProgress(clientData: any, serverData: any): any {
  const clientDays: number[] = clientData?.completedDays || [];
  const serverDays: number[] = serverData?.completedDays || [];
  const merged = [...new Set([...clientDays, ...serverDays])].sort((a, b) => a - b);

  return {
    ...serverData,
    ...clientData,
    completedDays: merged,
  };
}

/**
 * POST /api/sync
 * Main sync endpoint: push client changes, pull server changes.
 */
syncRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId;

    if (!checkRateLimit(userId)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const { deviceId, lastSyncAt, changes } = req.body as {
      deviceId: string;
      lastSyncAt: number;
      changes: SyncChange[];
    };

    if (!deviceId) {
      res.status(400).json({ error: 'Missing deviceId' });
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const serverChanges: SyncChange[] = [];
      const now = Date.now();

      // Process client changes
      for (const change of (changes || [])) {
        const { dataType, itemId, data, updatedAt, deleted } = change;

        // Check if item exists on server
        const [rows] = await conn.execute(
          'SELECT data, updated_at, deleted FROM sync_items WHERE user_id = ? AND data_type = ? AND item_id = ?',
          [userId, dataType, itemId]
        );

        const existing = (rows as any[])[0];

        if (!existing) {
          // Item doesn't exist on server - insert
          await conn.execute(
            'INSERT INTO sync_items (user_id, data_type, item_id, data, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, dataType, itemId, JSON.stringify(data), updatedAt, deleted ? 1 : 0]
          );
        } else if (updatedAt > existing.updated_at) {
          // Client is newer - update server
          if (dataType === 'planProgress') {
            // Special merge for reading plan progress
            const serverData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
            const merged = mergeReadingPlanProgress(data, serverData);
            await conn.execute(
              'UPDATE sync_items SET data = ?, updated_at = ?, deleted = ? WHERE user_id = ? AND data_type = ? AND item_id = ?',
              [JSON.stringify(merged), updatedAt, deleted ? 1 : 0, userId, dataType, itemId]
            );
          } else {
            await conn.execute(
              'UPDATE sync_items SET data = ?, updated_at = ?, deleted = ? WHERE user_id = ? AND data_type = ? AND item_id = ?',
              [JSON.stringify(data), updatedAt, deleted ? 1 : 0, userId, dataType, itemId]
            );
          }
        } else if (existing.updated_at > updatedAt) {
          // Server is newer - send server version back to client
          const serverData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;

          if (dataType === 'planProgress') {
            // Special merge for reading plan progress
            const merged = mergeReadingPlanProgress(data, serverData);
            serverChanges.push({
              dataType,
              itemId,
              data: merged,
              updatedAt: existing.updated_at,
              deleted: !!existing.deleted,
            });
            // Also update server with merged data
            await conn.execute(
              'UPDATE sync_items SET data = ? WHERE user_id = ? AND data_type = ? AND item_id = ?',
              [JSON.stringify(merged), userId, dataType, itemId]
            );
          } else {
            serverChanges.push({
              dataType,
              itemId,
              data: serverData,
              updatedAt: existing.updated_at,
              deleted: !!existing.deleted,
            });
          }
        }
        // Equal timestamps = no change needed
      }

      // Pull server changes since last sync (that aren't already handled above)
      const [serverRows] = await conn.execute(
        'SELECT data_type, item_id, data, updated_at, deleted FROM sync_items WHERE user_id = ? AND updated_at > ?',
        [userId, lastSyncAt || 0]
      );

      // Build a set of items we already processed from client changes
      const processedKeys = new Set(
        (changes || []).map((c: SyncChange) => `${c.dataType}:${c.itemId}`)
      );

      for (const row of (serverRows as any[])) {
        const key = `${row.data_type}:${row.item_id}`;
        if (!processedKeys.has(key)) {
          const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          serverChanges.push({
            dataType: row.data_type,
            itemId: row.item_id,
            data,
            updatedAt: row.updated_at,
            deleted: !!row.deleted,
          });
        }
      }

      // Update sync cursor for this device
      await conn.execute(
        'INSERT INTO sync_cursors (user_id, device_id, last_sync_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE last_sync_at = ?',
        [userId, deviceId, now, now]
      );

      await conn.commit();

      res.json({
        syncedAt: now,
        changes: serverChanges,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

/**
 * POST /api/sync/user-bibles
 * Sync user bible metadata (not chapter data).
 */
syncRouter.post('/user-bibles', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { bibles } = req.body as {
      bibles: Array<{
        id: string;
        name: string;
        mappingId: string;
        verseCounts?: any;
        uploadedAt: number;
        deleted?: boolean;
      }>;
    };

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const serverBibles: any[] = [];

      // Get all server bibles for this user
      const [existingRows] = await conn.execute(
        'SELECT id, name, mapping_id, verse_counts, uploaded_at, deleted FROM user_bibles WHERE user_id = ?',
        [userId]
      );
      const existingMap = new Map<string, any>();
      for (const row of (existingRows as any[])) {
        existingMap.set(row.id, row);
      }

      // Process client bibles
      for (const bible of (bibles || [])) {
        const existing = existingMap.get(bible.id);

        if (!existing) {
          await conn.execute(
            'INSERT INTO user_bibles (id, user_id, name, mapping_id, verse_counts, uploaded_at, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [bible.id, userId, bible.name, bible.mappingId, JSON.stringify(bible.verseCounts || null), bible.uploadedAt, bible.deleted ? 1 : 0]
          );
        } else if (bible.uploadedAt > existing.uploaded_at) {
          await conn.execute(
            'UPDATE user_bibles SET name = ?, mapping_id = ?, verse_counts = ?, uploaded_at = ?, deleted = ? WHERE id = ?',
            [bible.name, bible.mappingId, JSON.stringify(bible.verseCounts || null), bible.uploadedAt, bible.deleted ? 1 : 0, bible.id]
          );
        }

        existingMap.delete(bible.id);
      }

      // Return all server bibles (including ones not in client request)
      const [allRows] = await conn.execute(
        'SELECT id, name, mapping_id, verse_counts, uploaded_at, deleted FROM user_bibles WHERE user_id = ?',
        [userId]
      );

      for (const row of (allRows as any[])) {
        const verseCounts = typeof row.verse_counts === 'string' ? JSON.parse(row.verse_counts) : row.verse_counts;
        serverBibles.push({
          id: row.id,
          name: row.name,
          mappingId: row.mapping_id,
          verseCounts,
          uploadedAt: row.uploaded_at,
          deleted: !!row.deleted,
        });
      }

      await conn.commit();
      res.json({ bibles: serverBibles });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('User bible sync error:', err);
    res.status(500).json({ error: 'User bible sync failed' });
  }
});

/**
 * POST /api/sync/user-bible-chapters/:id
 * Upload bible chapters (chunked).
 */
syncRouter.post('/user-bible-chapters/:id', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const bibleId = req.params.id;
    const { chapters } = req.body as {
      chapters: Array<{ bookId: number; chapter: number; data: any }>;
    };

    // Verify ownership
    const [bibleRows] = await pool.execute(
      'SELECT id FROM user_bibles WHERE id = ? AND user_id = ?',
      [bibleId, userId]
    );
    if ((bibleRows as any[]).length === 0) {
      res.status(404).json({ error: 'Bible not found' });
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const ch of (chapters || [])) {
        await conn.execute(
          'INSERT INTO user_bible_chapters (bible_id, book_id, chapter, data) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [bibleId, ch.bookId, ch.chapter, JSON.stringify(ch.data)]
        );
      }

      await conn.commit();
      res.json({ ok: true, count: chapters?.length || 0 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Upload chapters error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * GET /api/sync/user-bible-chapters/:id
 * Download all chapters for a bible.
 */
syncRouter.get('/user-bible-chapters/:id', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const bibleId = req.params.id;

    // Verify ownership
    const [bibleRows] = await pool.execute(
      'SELECT id FROM user_bibles WHERE id = ? AND user_id = ?',
      [bibleId, userId]
    );
    if ((bibleRows as any[]).length === 0) {
      res.status(404).json({ error: 'Bible not found' });
      return;
    }

    const [rows] = await pool.execute(
      'SELECT book_id, chapter, data FROM user_bible_chapters WHERE bible_id = ? ORDER BY book_id, chapter',
      [bibleId]
    );

    const chapters = (rows as any[]).map(row => ({
      bookId: row.book_id,
      chapter: row.chapter,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    }));

    res.json({ chapters });
  } catch (err) {
    console.error('Download chapters error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});
