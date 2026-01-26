import { useParams, useSearchParams } from 'react-router-dom';
import { ChapterContent } from '@/components/bible/ChapterContent';
import { getBookInfoBySlug, getBookInfoById } from '@/lib/books-data';

export function ChapterPage() {
  const { book: bookSlug, chapter: chapterStr } = useParams<{ book: string; chapter: string }>();
  const [searchParams] = useSearchParams();
  const bible = searchParams.get('bible') || 'osnb2';

  if (!bookSlug || !chapterStr) {
    return (
      <div className="reading-container">
        <h1>Feil</h1>
        <p>Ugyldig URL</p>
      </div>
    );
  }

  const chapter = parseInt(chapterStr, 10);
  if (isNaN(chapter) || chapter < 1) {
    return (
      <div className="reading-container">
        <h1>Feil</h1>
        <p>Ugyldig kapittelnummer</p>
      </div>
    );
  }

  const bookInfo = getBookInfoBySlug(bookSlug);
  if (!bookInfo) {
    return (
      <div className="reading-container">
        <h1>Bok ikke funnet</h1>
        <p>Kunne ikke finne boken &quot;{bookSlug}&quot;</p>
      </div>
    );
  }

  if (chapter > bookInfo.chapters) {
    return (
      <div className="reading-container">
        <h1>Kapittel ikke funnet</h1>
        <p>{bookInfo.name_no} har bare {bookInfo.chapters} kapitler</p>
      </div>
    );
  }

  const nextBook = getBookInfoById(bookInfo.id + 1);

  return (
    <ChapterContent
      bookId={bookInfo.id}
      bookName={bookInfo.name_no}
      bookSlug={bookSlug}
      chapter={chapter}
      maxChapter={bookInfo.chapters}
      nextBookName={nextBook?.name_no}
      nextBookSlug={nextBook?.short_name.toLowerCase()}
      bible={bible}
    />
  );
}
