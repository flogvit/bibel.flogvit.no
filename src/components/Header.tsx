'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.scss';
import { LoadingIndicator } from './LoadingIndicator';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        router.push(data.reference.url);
        setSearchQuery('');
        setMenuOpen(false);
        return;
      }
    } catch (error) {
      console.error('Reference check failed:', error);
    }

    // Not a reference, go to search page
    router.push(`/sok?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMenuOpen(false);
  }

  function handleNavClick() {
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          FLOGVIT.bibel
        </Link>
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
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Lukk meny' : 'Åpne meny'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          <span className={styles.hamburger} aria-hidden="true"></span>
        </button>

        <nav id="main-nav" className={`${styles.nav} ${menuOpen ? styles.open : ''}`} aria-label="Hovednavigasjon">
          <Link href="/" className={styles.navLink} onClick={handleNavClick}>
            Bøker
          </Link>
          <Link href="/sok" className={styles.navLink} onClick={handleNavClick}>
            Søk
          </Link>

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
              <Link href="/kjente-vers" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Kjente vers
              </Link>
              <Link href="/favoritter" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Favoritter
              </Link>
              <Link href="/emner" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Emner
              </Link>
              <Link href="/notater" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Notater
              </Link>
              <Link href="/leseplan" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Leseplan
              </Link>
              <Link href="/temaer" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Temaer
              </Link>
              <Link href="/tidslinje" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Tidslinje
              </Link>
              <Link href="/profetier" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Profetier
              </Link>
              <Link href="/personer" className={styles.dropdownLink} onClick={handleNavClick} role="menuitem">
                Personer
              </Link>
            </div>
          </div>

          {/* Mobile: show dropdown items inline */}
          <div className={styles.mobileDropdownItems}>
            <Link href="/kjente-vers" className={styles.navLink} onClick={handleNavClick}>
              Kjente vers
            </Link>
            <Link href="/favoritter" className={styles.navLink} onClick={handleNavClick}>
              Favoritter
            </Link>
            <Link href="/emner" className={styles.navLink} onClick={handleNavClick}>
              Emner
            </Link>
            <Link href="/notater" className={styles.navLink} onClick={handleNavClick}>
              Notater
            </Link>
            <Link href="/leseplan" className={styles.navLink} onClick={handleNavClick}>
              Leseplan
            </Link>
            <Link href="/temaer" className={styles.navLink} onClick={handleNavClick}>
              Temaer
            </Link>
            <Link href="/tidslinje" className={styles.navLink} onClick={handleNavClick}>
              Tidslinje
            </Link>
            <Link href="/profetier" className={styles.navLink} onClick={handleNavClick}>
              Profetier
            </Link>
            <Link href="/personer" className={styles.navLink} onClick={handleNavClick}>
              Personer
            </Link>
          </div>

          <Link href="/om" className={styles.navLink} onClick={handleNavClick}>
            Om
          </Link>
        </nav>
      </div>
    </header>
  );
}
