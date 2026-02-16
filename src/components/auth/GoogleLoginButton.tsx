import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import styles from './GoogleLoginButton.module.scss';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          revoke: (email: string, callback: () => void) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setError(null);
      await loginWithGoogle(response.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Innlogging feilet');
    }
  }, [loginWithGoogle]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google?.accounts) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      locale: 'no',
      width: 280,
    });
  }, [scriptLoaded, handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className={styles.noConfig}>Google-innlogging er ikke konfigurert.</p>;
  }

  return (
    <div className={styles.container}>
      <div ref={buttonRef} className={styles.button} />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
