import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// Critical pages - loaded immediately
import { HomePage } from './pages/HomePage';
import { ChapterPage } from './pages/ChapterPage';

// Lazy-loaded pages - loaded on demand
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const PropheciesPage = lazy(() => import('./pages/PropheciesPage').then(m => ({ default: m.PropheciesPage })));
const PersonsPage = lazy(() => import('./pages/PersonsPage').then(m => ({ default: m.PersonsPage })));
const PersonPage = lazy(() => import('./pages/PersonPage').then(m => ({ default: m.PersonPage })));
const ReadingPlanPage = lazy(() => import('./pages/ReadingPlanPage').then(m => ({ default: m.ReadingPlanPage })));
const ThemesPage = lazy(() => import('./pages/ThemesPage').then(m => ({ default: m.ThemesPage })));
const ThemePage = lazy(() => import('./pages/ThemePage').then(m => ({ default: m.ThemePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const OriginalSearchPage = lazy(() => import('./pages/OriginalSearchPage').then(m => ({ default: m.OriginalSearchPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const FamousVersesPage = lazy(() => import('./pages/FamousVersesPage').then(m => ({ default: m.FamousVersesPage })));
const TopicsPage = lazy(() => import('./pages/TopicsPage').then(m => ({ default: m.TopicsPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })));
const TextPage = lazy(() => import('./pages/TextPage').then(m => ({ default: m.TextPage })));
const OfflinePage = lazy(() => import('./pages/OfflinePage').then(m => ({ default: m.OfflinePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage').then(m => ({ default: m.AccessibilityPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Loading fallback
function PageLoader() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
      Laster...
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Bible reading */}
          <Route path="/:book/:chapter" element={<ChapterPage />} />

          {/* Study tools */}
          <Route path="/tidslinje" element={<TimelinePage />} />
          <Route path="/profetier" element={<PropheciesPage />} />
          <Route path="/personer" element={<PersonsPage />} />
          <Route path="/personer/:personId" element={<PersonPage />} />
          <Route path="/temaer" element={<ThemesPage />} />
          <Route path="/temaer/:tema" element={<ThemePage />} />
          <Route path="/leseplan" element={<ReadingPlanPage />} />

          {/* Search */}
          <Route path="/sok" element={<SearchPage />} />
          <Route path="/sok/original" element={<OriginalSearchPage />} />

          {/* User content */}
          <Route path="/favoritter" element={<FavoritesPage />} />
          <Route path="/kjente-vers" element={<FamousVersesPage />} />
          <Route path="/emner" element={<TopicsPage />} />
          <Route path="/notater" element={<NotesPage />} />
          <Route path="/tekst" element={<TextPage />} />

          {/* Utility */}
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/om" element={<AboutPage />} />
          <Route path="/tilgjengelighet" element={<AccessibilityPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
