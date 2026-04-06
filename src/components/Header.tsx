import { Link, useNavigate } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef } from 'react';
import styles from './Header.module.scss';
import { LoadingIndicator } from './LoadingIndicator';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncStatusIndicator } from './sync/SyncStatusIndicator';
import { LayoutModeButtons } from '@/components/bible/LayoutModeButtons';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Keyboard shortcut: "/" or Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // "/" key to focus search
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const refs = dropdownRefs.current;
      const clickedInside = Object.values(refs).some(
        ref => ref && ref.contains(e.target as Node)
      );
      if (!clickedInside) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll and add class when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Try to parse as Bible reference first
    try {
      const response = await fetch(`/api/reference?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.reference?.url) {
        navigate(data.reference.url);
        setSearchQuery('');
        setMenuOpen(false);
        return;
      }
    } catch (error) {
      console.error('Reference check failed:', error);
    }

    // Not a reference, go to search page
    navigate(`/sok?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMenuOpen(false);
  }

  function handleNavClick() {
    setMenuOpen(false);
    setOpenDropdown(null);
  }

  function toggleDropdown(name: string) {
    setOpenDropdown(prev => prev === name ? null : name);
  }

  const mod = isMac ? '⌥⇧' : 'Alt+Shift+';

  function shortcut(key: string) {
    return <span className={styles.shortcutHint}>{mod}{key}</span>;
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          FLOGVIT.bibel
        </Link>
        <OfflineIndicator />
        <SyncStatusIndicator />
        <Suspense fallback={null}>
          <LoadingIndicator />
        </Suspense>

        <form onSubmit={handleSearch} className={styles.searchForm} role="search" aria-label="Søk i Bibelen">
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk... (/)"
            className={styles.searchInput}
            aria-label="Søk etter bibelvers eller tekst"
          />
          <button type="submit" className={styles.searchButton} aria-label="Utfør søk">
            🔍
          </button>
        </form>

        <LayoutModeButtons />

        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Lukk meny' : 'Åpne meny'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          <span className={styles.hamburger} aria-hidden="true"></span>
        </button>

        <nav id="main-nav" className={`${styles.nav} ${menuOpen ? styles.open : ''}`} aria-label="Hovednavigasjon">
          {/* Desktop dropdowns */}
          <div className={styles.dropdown} ref={el => { dropdownRefs.current['mitt'] = el; }}>
            <button
              className={`${styles.navLink} ${styles.dropdownTrigger}`}
              onClick={() => toggleDropdown('mitt')}
              aria-expanded={openDropdown === 'mitt'}
              aria-haspopup="true"
            >
              Mitt
              <span className={`${styles.dropdownArrow} ${openDropdown === 'mitt' ? styles.open : ''}`} aria-hidden="true">▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${openDropdown === 'mitt' ? styles.open : ''}`} role="menu">
              <Link to="/favoritter" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Favoritter {shortcut('F')}
              </Link>
              <Link to="/emner" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Emner {shortcut('E')}
              </Link>
              <Link to="/notater" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Notater {shortcut('N')}
              </Link>
              <Link to="/lister" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Verslister {shortcut('V')}
              </Link>
              <Link to="/leseplan" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Leseplan {shortcut('L')}
              </Link>
              <Link to="/manuskripter" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Manuskripter {shortcut('M')}
              </Link>
            </div>
          </div>

          <div className={styles.dropdown} ref={el => { dropdownRefs.current['studier'] = el; }}>
            <button
              className={`${styles.navLink} ${styles.dropdownTrigger}`}
              onClick={() => toggleDropdown('studier')}
              aria-expanded={openDropdown === 'studier'}
              aria-haspopup="true"
            >
              Studier
              <span className={`${styles.dropdownArrow} ${openDropdown === 'studier' ? styles.open : ''}`} aria-hidden="true">▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${openDropdown === 'studier' ? styles.open : ''}`} role="menu">
              <Link to="/kjente-vers" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Kjente vers {shortcut('K')}
              </Link>
              <Link to="/temaer" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Temaer {shortcut('C')}
              </Link>
              <Link to="/historier" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Bibelhistorier {shortcut('B')}
              </Link>
              <Link to="/profetier" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Profetier {shortcut('P')}
              </Link>
              <Link to="/paralleller" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Paralleller {shortcut('A')}
              </Link>
              <Link to="/personer" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Personer {shortcut('O')}
              </Link>
              <Link to="/tall" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Tall {shortcut('Y')}
              </Link>
            </div>
          </div>

          <div className={styles.dropdown} ref={el => { dropdownRefs.current['oversikt'] = el; }}>
            <button
              className={`${styles.navLink} ${styles.dropdownTrigger}`}
              onClick={() => toggleDropdown('oversikt')}
              aria-expanded={openDropdown === 'oversikt'}
              aria-haspopup="true"
            >
              Oversikt
              <span className={`${styles.dropdownArrow} ${openDropdown === 'oversikt' ? styles.open : ''}`} aria-hidden="true">▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${openDropdown === 'oversikt' ? styles.open : ''}`} role="menu">
              <Link to="/tidslinje" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Tidslinje {shortcut('T')}
              </Link>
              <Link to="/dager" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Dager {shortcut('D')}
              </Link>
              <Link to="/lesetekster" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Lesetekster
              </Link>
              <Link to="/statistikk" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Statistikk {shortcut('I')}
              </Link>
              <Link to="/oversettelser" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Oversettelser
              </Link>
            </div>
          </div>

          {/* Mobile: grouped items */}
          <div className={styles.mobileDropdownItems}>
            <div className={styles.mobileGroup}>
              <span className={styles.mobileGroupTitle}>Mitt</span>
              <Link to="/favoritter" className={styles.navLink} onClick={handleNavClick}>Favoritter</Link>
              <Link to="/emner" className={styles.navLink} onClick={handleNavClick}>Emner</Link>
              <Link to="/notater" className={styles.navLink} onClick={handleNavClick}>Notater</Link>
              <Link to="/lister" className={styles.navLink} onClick={handleNavClick}>Verslister</Link>
              <Link to="/leseplan" className={styles.navLink} onClick={handleNavClick}>Leseplan</Link>
              <Link to="/manuskripter" className={styles.navLink} onClick={handleNavClick}>Andakter</Link>
            </div>
            <div className={styles.mobileGroup}>
              <span className={styles.mobileGroupTitle}>Studier</span>
              <Link to="/kjente-vers" className={styles.navLink} onClick={handleNavClick}>Kjente vers</Link>
              <Link to="/temaer" className={styles.navLink} onClick={handleNavClick}>Temaer</Link>
              <Link to="/historier" className={styles.navLink} onClick={handleNavClick}>Bibelhistorier</Link>
              <Link to="/profetier" className={styles.navLink} onClick={handleNavClick}>Profetier</Link>
              <Link to="/paralleller" className={styles.navLink} onClick={handleNavClick}>Paralleller</Link>
              <Link to="/personer" className={styles.navLink} onClick={handleNavClick}>Personer</Link>
              <Link to="/tall" className={styles.navLink} onClick={handleNavClick}>Tall</Link>
            </div>
            <div className={styles.mobileGroup}>
              <span className={styles.mobileGroupTitle}>Oversikt</span>
              <Link to="/tidslinje" className={styles.navLink} onClick={handleNavClick}>Tidslinje</Link>
              <Link to="/dager" className={styles.navLink} onClick={handleNavClick}>Dager</Link>
              <Link to="/lesetekster" className={styles.navLink} onClick={handleNavClick}>Lesetekster</Link>
              <Link to="/statistikk" className={styles.navLink} onClick={handleNavClick}>Statistikk</Link>
              <Link to="/oversettelser" className={styles.navLink} onClick={handleNavClick}>Oversettelser</Link>
            </div>
          </div>

        </nav>
      </div>
    </header>
  );
}
