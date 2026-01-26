import { Router, Request, Response } from 'express';
import { getDb } from '../../src/lib/db';

export const versionRouter = Router();

/**
 * GET /api/version
 * Returns database version info
 */
versionRouter.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDb();

    const versionRow = db.prepare(
      "SELECT value FROM db_meta WHERE key = 'version'"
    ).get() as { value: string } | undefined;

    const importedAtRow = db.prepare(
      "SELECT value FROM db_meta WHERE key = 'imported_at'"
    ).get() as { value: string } | undefined;

    const syncVersionRow = db.prepare(
      "SELECT value FROM db_meta WHERE key = 'sync_version'"
    ).get() as { value: string } | undefined;

    if (!versionRow) {
      res.json({
        version: '1970-01-01 00:00:00',
        importedAt: null,
        syncVersion: 0,
      });
      return;
    }

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      version: versionRow.value,
      importedAt: importedAtRow?.value || null,
      syncVersion: syncVersionRow ? parseInt(syncVersionRow.value, 10) : 0,
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      version: '1970-01-01 00:00:00',
      importedAt: null,
      syncVersion: 0,
    });
  }
});
