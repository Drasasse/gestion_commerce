import React from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GlobalLoadingProps {
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  loadingText?: string;
  errorText?: string;
  successText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

/**
 * Composant de chargement global standardisé
 */
export default function GlobalLoading({
  isLoading = false,
  error = null,
  success = false,
  loadingText = 'Chargement...',
  errorText,
  successText,
  size = 'md',
  variant = 'spinner',
  className = '',
}: GlobalLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (success && successText) {
    return (
      <div className={`flex items-center justify-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className={sizeClasses[size]} />
        <span className={textSizeClasses[size]}>{successText}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center space-x-2 text-red-600 ${className}`}>
        <AlertCircle className={sizeClasses[size]} />
        <span className={textSizeClasses[size]}>{errorText || error}</span>
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  const renderSpinner = () => (
    <Loader2 className={`${sizeClasses[size]} animate-spin`} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-current rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`} />
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 text-blue-600 ${className}`}>
      {renderVariant()}
      <span className={textSizeClasses[size]}>{loadingText}</span>
    </div>
  );
}

/**
 * Composant de chargement pour les pages entières
 */
export function PageLoading({
  text = 'Chargement de la page...',
  className = '',
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 ${className}`}>
      <div className="text-center">
        <GlobalLoading
          isLoading={true}
          loadingText={text}
          size="lg"
          variant="spinner"
        />
      </div>
    </div>
  );
}

/**
 * Composant de chargement pour les boutons
 */
export function ButtonLoading({
  isLoading = false,
  children,
  loadingText = 'Chargement...',
  disabled = false,
  className = '',
  ...props
}: {
  isLoading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Composant de chargement pour les cartes
 */
export function CardLoading({
  title = 'Chargement...',
  className = '',
}: {
  title?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Overlay de chargement pour les modales
 */
export function ModalLoading({
  isVisible = false,
  text = 'Traitement en cours...',
}: {
  isVisible?: boolean;
  text?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <GlobalLoading
          isLoading={true}
          loadingText={text}
          size="md"
          variant="spinner"
        />
      </div>
    </div>
  );
}