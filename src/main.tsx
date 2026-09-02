import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 🛡️ DOM SAFEGUARD: Protege contra extensiones del navegador, Google Translate / traducción automática
// de iOS/Android que alteran el árbol DOM de React y causan el error "Failed to execute removeChild on Node".
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
      if (child && child.parentNode !== this) {
        if (child.parentNode) {
          return child.parentNode.removeChild(child) as T;
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    } catch (e) {
      console.warn('[DOM Safeguard] Handled removeChild error:', e);
      if (child && child.parentNode) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch {
          return child;
        }
      }
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (referenceNode.parentNode) {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        }
        return this.appendChild(newNode) as T;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (e) {
      console.warn('[DOM Safeguard] Handled insertBefore error:', e);
      try {
        return this.appendChild(newNode) as T;
      } catch {
        return newNode;
      }
    }
  };

  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    try {
      if (oldChild && oldChild.parentNode !== this) {
        if (oldChild.parentNode) {
          return oldChild.parentNode.replaceChild(newChild, oldChild) as T;
        }
        return oldChild;
      }
      return originalReplaceChild.call(this, newChild, oldChild) as T;
    } catch (e) {
      console.warn('[DOM Safeguard] Handled replaceChild error:', e);
      return oldChild;
    }
  };
}

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

  handleResetAndGoHome = () => {
    try {
      // Limpiar datos transitorios de sala/partida
      sessionStorage.clear();
      // Eliminar parámetros de búsqueda de la URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.href = cleanUrl;
    } catch {
      window.location.reload();
    }
  };

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
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '16px'
          }}>
            🕊️
          </div>
          <h2 style={{ color: '#F59E0B', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
            Partida sincronizada
          </h2>
          <p style={{ color: '#D6D0C4', maxWidth: '380px', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
            Hubo una sincronización en la vista del juego. Puedes volver al menú principal para continuar jugando sin perder tu cuenta.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleResetAndGoHome}
              style={{
                backgroundColor: '#D97706',
                color: '#1B1A17',
                fontWeight: '900',
                padding: '12px 24px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
              }}
            >
              🏠 Ir al Menú Principal
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2A2621',
                color: '#F3E8D2',
                fontWeight: 'bold',
                padding: '12px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🔄 Recargar
            </button>
          </div>
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

