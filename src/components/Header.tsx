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

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk... (/)"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton} aria-label="Søk">
            🔍
          </button>
        </form>

        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Meny"
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburger}></span>
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`}>
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
            >
              Ressurser
              <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.open : ''}`}>▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${dropdownOpen ? styles.open : ''}`}>
              <Link href="/kjente-vers" className={styles.dropdownLink} onClick={handleNavClick}>
                Kjente vers
              </Link>
              <Link href="/favoritter" className={styles.dropdownLink} onClick={handleNavClick}>
                Favoritter
              </Link>
              <Link href="/emner" className={styles.dropdownLink} onClick={handleNavClick}>
                Emner
              </Link>
              <Link href="/notater" className={styles.dropdownLink} onClick={handleNavClick}>
                Notater
              </Link>
              <Link href="/leseplan" className={styles.dropdownLink} onClick={handleNavClick}>
                Leseplan
              </Link>
              <Link href="/temaer" className={styles.dropdownLink} onClick={handleNavClick}>
                Temaer
              </Link>
              <Link href="/tidslinje" className={styles.dropdownLink} onClick={handleNavClick}>
                Tidslinje
              </Link>
              <Link href="/profetier" className={styles.dropdownLink} onClick={handleNavClick}>
                Profetier
              </Link>
              <Link href="/personer" className={styles.dropdownLink} onClick={handleNavClick}>
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
