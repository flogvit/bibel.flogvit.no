import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// Page components
import { HomePage } from './pages/HomePage';
import { ChapterPage } from './pages/ChapterPage';
import { TimelinePage } from './pages/TimelinePage';
import { PropheciesPage } from './pages/PropheciesPage';
import { PersonsPage } from './pages/PersonsPage';
import { PersonPage } from './pages/PersonPage';
import { ReadingPlanPage } from './pages/ReadingPlanPage';
import { ThemesPage } from './pages/ThemesPage';
import { ThemePage } from './pages/ThemePage';
import { SearchPage } from './pages/SearchPage';
import { OriginalSearchPage } from './pages/OriginalSearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { FamousVersesPage } from './pages/FamousVersesPage';
import { TopicsPage } from './pages/TopicsPage';
import { NotesPage } from './pages/NotesPage';
import { TextPage } from './pages/TextPage';
import { OfflinePage } from './pages/OfflinePage';
import { AboutPage } from './pages/AboutPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Layout>
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
    </Layout>
  );
}
