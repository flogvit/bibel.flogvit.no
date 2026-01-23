import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { AxeAccessibility } from '@/components/AxeAccessibility';
import { NavigationAnnouncer } from '@/components/NavigationAnnouncer';

export const metadata: Metadata = {
  title: {
    default: 'FLOGVIT.bibel',
    template: '%s | FLOGVIT.bibel',
  },
  description: 'Norsk bibel med oppslagsverk og verktøy for bibellesning. Gratis tilgang til bibelteksten med ord-for-ord forklaringer, kryssreferanser og studieverktøy.',
  keywords: ['bibel', 'norsk bibel', 'bibelen', 'bibellesning', 'bibelstudie', 'kristen', 'GT', 'NT'],
  authors: [{ name: 'Flogvit' }],
  creator: 'Flogvit',
  metadataBase: new URL('https://bibel.flogvit.no'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: 'https://bibel.flogvit.no',
    siteName: 'FLOGVIT.bibel',
    title: 'Bibelen - Les Guds ord på norsk',
    description: 'Åpen norsk bibel med oppslagsverk og verktøy for bibellesning. Gratis tilgang til bibelteksten med ord-for-ord forklaringer, kryssreferanser og studieverktøy.',
  },
  twitter: {
    card: 'summary',
    title: 'Bibelen - bibel.flogvit.no',
    description: 'Norsk bibel med oppslagsverk og verktøy for bibellesning',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body>
        <Providers>
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
          <AxeAccessibility />
        </Providers>
      </body>
    </html>
  );
}
