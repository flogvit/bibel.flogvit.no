import { Link, useNavigate } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef } from 'react';
import styles from './Header.module.scss';
import { LoadingIndicator } from './LoadingIndicator';
import { OfflineIndicator } from './OfflineIndicator';
import { useSettings } from './SettingsContext';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { settings, toggleSetting } = useSettings();

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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
    setDropdownOpen(false);
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

        <button
          className={`${styles.readingModeButton} ${settings.readingMode ? styles.active : ''}`}
          onClick={() => toggleSetting('readingMode')}
          aria-label={settings.readingMode ? 'Slå av lesemodus' : 'Slå på lesemodus'}
          aria-pressed={settings.readingMode}
          title={`Lesemodus ${settings.readingMode ? 'på' : 'av'} (R)`}
        >
          <span className={styles.readingModeIcon} aria-hidden="true">📖</span>
        </button>

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
          {/* Dropdown for desktop */}
          <div className={styles.dropdown} ref={dropdownRef}>
            <button
              className={`${styles.navLink} ${styles.dropdownTrigger}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-controls="resources-menu"
            >
              Ressurser
              <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.open : ''}`} aria-hidden="true">▾</span>
            </button>
            <div id="resources-menu" className={`${styles.dropdownMenu} ${dropdownOpen ? styles.open : ''}`} role="menu">
              <Link to="/kjente-vers" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Kjente vers {shortcut('K')}
              </Link>
              <Link to="/favoritter" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Favoritter {shortcut('F')}
              </Link>
              <Link to="/emner" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Emner {shortcut('E')}
              </Link>
              <Link to="/notater" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Notater {shortcut('N')}
              </Link>
              <Link to="/manuskripter" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Manuskripter {shortcut('M')}
              </Link>
              <Link to="/lister" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Verslister {shortcut('V')}
              </Link>
              <Link to="/leseplan" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Leseplan {shortcut('L')}
              </Link>
              <Link to="/temaer" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Temaer {shortcut('C')}
              </Link>
              <Link to="/historier" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Bibelhistorier {shortcut('B')}
              </Link>
              <Link to="/tidslinje" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Tidslinje {shortcut('T')}
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
              <Link to="/statistikk" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Statistikk {shortcut('I')}
              </Link>
              <Link to="/oversettelser" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Oversettelser
              </Link>
            </div>
          </div>

          {/* Mobile: show dropdown items inline */}
          <div className={styles.mobileDropdownItems}>
            <Link to="/kjente-vers" className={styles.navLink} onClick={handleNavClick}>
              Kjente vers
            </Link>
            <Link to="/favoritter" className={styles.navLink} onClick={handleNavClick}>
              Favoritter
            </Link>
            <Link to="/emner" className={styles.navLink} onClick={handleNavClick}>
              Emner
            </Link>
            <Link to="/notater" className={styles.navLink} onClick={handleNavClick}>
              Notater
            </Link>
            <Link to="/manuskripter" className={styles.navLink} onClick={handleNavClick}>
              Andakter
            </Link>
            <Link to="/lister" className={styles.navLink} onClick={handleNavClick}>
              Verslister
            </Link>
            <Link to="/leseplan" className={styles.navLink} onClick={handleNavClick}>
              Leseplan
            </Link>
            <Link to="/temaer" className={styles.navLink} onClick={handleNavClick}>
              Temaer
            </Link>
            <Link to="/historier" className={styles.navLink} onClick={handleNavClick}>
              Bibelhistorier
            </Link>
            <Link to="/tidslinje" className={styles.navLink} onClick={handleNavClick}>
              Tidslinje
            </Link>
            <Link to="/profetier" className={styles.navLink} onClick={handleNavClick}>
              Profetier
            </Link>
            <Link to="/paralleller" className={styles.navLink} onClick={handleNavClick}>
              Paralleller
            </Link>
            <Link to="/personer" className={styles.navLink} onClick={handleNavClick}>
              Personer
            </Link>
            <Link to="/statistikk" className={styles.navLink} onClick={handleNavClick}>
              Statistikk
            </Link>
            <Link to="/oversettelser" className={styles.navLink} onClick={handleNavClick}>
              Oversettelser
            </Link>
          </div>

        </nav>
      </div>
    </header>
  );
}
