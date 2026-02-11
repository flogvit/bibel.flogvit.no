import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import { chapterRouter } from './routes/chapter';
import { booksRouter } from './routes/books';
import { versesRouter } from './routes/verses';
import { timelineRouter } from './routes/timeline';
import { propheciesRouter } from './routes/prophecies';
import { personsRouter } from './routes/persons';
import { readingPlansRouter } from './routes/reading-plans';
import { searchRouter } from './routes/search';
import { versionRouter } from './routes/version';
import { themesRouter } from './routes/themes';
import { favoritesRouter } from './routes/favorites';
import { wellknownVersesRouter } from './routes/wellknown-verses';
import { word4wordRouter } from './routes/word4word';
import { referencesRouter } from './routes/references';
import { verseExtrasRouter } from './routes/verse-extras';
import { referenceRouter } from './routes/reference';
import { importantWordsRouter } from './routes/important-words';
import { dailyVerseRouter } from './routes/daily-verse';
import { parallelsRouter } from './routes/parallels';
import { statisticsRouter } from './routes/statistics';
import { mappingsRouter } from './routes/mappings';
import { chapterContextRouter } from './routes/chapter-context';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3018;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/chapter', chapterRouter);
app.use('/api/books', booksRouter);
app.use('/api/verses', versesRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/prophecies', propheciesRouter);
app.use('/api/persons', personsRouter);
app.use('/api/reading-plans', readingPlansRouter);
app.use('/api/leseplan', readingPlansRouter); // Alias
app.use('/api/search', searchRouter);
app.use('/api/version', versionRouter);
app.use('/api/themes', themesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/wellknown-verses', wellknownVersesRouter);
app.use('/api/word4word', word4wordRouter);
app.use('/api/references', referencesRouter);
app.use('/api/verse-extras', verseExtrasRouter);
app.use('/api/reference', referenceRouter);
app.use('/api/important-words', importantWordsRouter);
app.use('/api/daily-verse', dailyVerseRouter);
app.use('/api/parallels', parallelsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/mappings', mappingsRouter);
app.use('/api/chapter-context', chapterContextRouter);

// Serve static files from Vite build
const distPath = path.join(__dirname, '..', 'dist');

// Hashed assets (e.g. /assets/index-abc123.js) - cache aggressively
app.use('/assets', express.static(path.join(distPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// Other static files - short cache with revalidation
app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // index.html should never be cached by the browser
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
