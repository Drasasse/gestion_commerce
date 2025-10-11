/**
 * Button Component
 *
 * Composant bouton atomique avec variants et tailles
 * Utilise CVA (Class Variance Authority) pour la gestion des variants
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Classes de base
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        success:
          'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
        warning:
          'bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500 shadow-sm',
        outline:
          'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost:
          'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        link:
          'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-6 text-lg',
        xl: 'h-12 px-8 text-xl',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Afficher un loader */
  loading?: boolean;
  /** Icône à gauche */
  leftIcon?: React.ReactNode;
  /** Icône à droite */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
