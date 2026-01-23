import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'FLOGVIT.bibel',
    template: '%s | FLOGVIT.bibel',
  },
  description: 'Norsk bibel med oppslagsverk og verktøy for bibellesning. Gratis tilgang til bibelteksten med ord-for-ord forklaringer, kryssreferanser og studieverktøy.',
  keywords: ['bibel', 'norsk bibel', 'bibelen', 'bibellesning', 'bibelstudie', 'kristen', 'GT', 'NT'],
  authors: [{ name: 'Flogvit' }],
  creator: 'Flogvit',
  metadataBase: new URL('https://bibel.flogvit.com'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: 'https://bibel.flogvit.com',
    siteName: 'FLOGVIT.bibel',
    title: 'Bibelen - Les Guds ord på norsk',
    description: 'Åpen norsk bibel med oppslagsverk og verktøy for bibellesning. Gratis tilgang til bibelteksten med ord-for-ord forklaringer, kryssreferanser og studieverktøy.',
  },
  twitter: {
    card: 'summary',
    title: 'Bibelen - bibel.flogvit.com',
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
    <html lang="no">
      <body>
        <Providers>
          <div className="page">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
