import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
  retryCount: number;
}

const MAX_AUTO_RETRIES = 2;
const AUTO_RETRY_DELAY = 1000;

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    const isChunkError = this.isChunkLoadError(error);

    this.setState({
      errorInfo: errorInfo.componentStack || '',
    }, () => {
      // Auto-retry for chunk loading errors (common during HMR/deploys)
      if (isChunkError && this.state.retryCount < MAX_AUTO_RETRIES) {
        console.log(`Chunk load error detected, auto-retrying (${this.state.retryCount + 1}/${MAX_AUTO_RETRIES})...`);
        setTimeout(() => {
          this.setState(prev => ({
            retryCount: prev.retryCount + 1
          }), () => {
            this.handleRetry();
          });
        }, AUTO_RETRY_DELAY);
      }
    });
  }

  isChunkLoadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('unable to preload css') ||
      error.name === 'ChunkLoadError'
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error && this.isChunkLoadError(this.state.error);

      // Show minimal UI during auto-retry
      if (isChunkError && this.state.retryCount < MAX_AUTO_RETRIES) {
        return (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#666'
          }}>
            Laster på nytt...
          </div>
        );
      }

      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#c9a959', marginBottom: '1rem' }}>
            Noe gikk galt
          </h2>

          {isChunkError ? (
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Kunne ikke laste siden. Dette kan skje etter en oppdatering.
              Prøv å laste siden på nytt.
            </p>
          ) : (
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              En uventet feil oppstod. Prøv å laste siden på nytt.
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Prøv igjen
            </button>

            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#8b7355',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Last siden på nytt
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              textAlign: 'left',
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px'
            }}>
              <summary style={{ cursor: 'pointer', color: '#999' }}>
                Teknisk informasjon
              </summary>
              <pre style={{
                fontSize: '0.8rem',
                overflow: 'auto',
                marginTop: '1rem'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
