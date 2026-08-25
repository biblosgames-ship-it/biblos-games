import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#1B1A17',
          color: '#F3E8D2',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#F59E0B', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            ⚠️ Ocurrió un detalle en la vista
          </h2>
          <p style={{ color: '#D6D0C4', maxWidth: '400px', fontSize: '14px', marginBottom: '20px' }}>
            {this.state.error?.message || 'Error inesperado al cargar la sala.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#D97706',
              color: '#000',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Recargar y Continuar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  console.error('GLOBAL RUNTIME ERROR:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('GLOBAL UNHANDLED PROMISE:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

