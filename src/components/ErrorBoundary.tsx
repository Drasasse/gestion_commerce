'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React
 * Affiche une UI de fallback au lieu de crasher toute l'app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // En production, envoyer à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // TODO: Envoyer à Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personnalisée
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oups ! Une erreur est survenue
              </h1>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {process.env.NODE_ENV === 'development' && this.state.error
                  ? this.state.error.message
                  : 'Nous rencontrons des difficultés techniques. Veuillez réessayer.'}
              </p>

              {/* Détails en développement */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Détails techniques
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-48">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Réessayer
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour gérer les erreurs dans les composants fonctionnels
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * Composant d'erreur simple pour affichage inline
 */
export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant loading avec état d'erreur
 */
interface LoadingStateProps {
  loading: boolean;
  error: Error | null;
  children: ReactNode;
  onRetry?: () => void;
}

export function LoadingState({ loading, error, children, onRetry }: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={onRetry} />;
  }

  return <>{children}</>;
}
