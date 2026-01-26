import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { NavigationAnnouncer } from './NavigationAnnouncer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Hopp til hovedinnhold
      </a>
      <div className="page">
        <Header />
        <main id="main-content">
          {children}
        </main>
        <Footer />
      </div>
      <KeyboardShortcuts />
      <NavigationAnnouncer />
    </>
  );
}
