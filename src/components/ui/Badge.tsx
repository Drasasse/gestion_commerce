/**
 * Badge Component
 *
 * Composant badge pour afficher des statuts, tags, etc.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useDesignTokens } from '@/hooks/useDesignTokens';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        success: 'bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
        danger: 'bg-red-100 text-red-800 hover:bg-red-200',
        info: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
        outline: 'border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
        solid: 'bg-gray-800 text-white hover:bg-gray-900',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
      dot: {
        true: 'pl-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Afficher un point coloré */
  showDot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, showDot, children, ...props }, ref) => {
    const tokens = useDesignTokens();

    const getDotColor = () => {
      const colorMap = {
        default: tokens.colors.gray[500],
        primary: tokens.colors.primary[600],
        success: tokens.colors.success[600],
        warning: tokens.colors.warning[600],
        danger: tokens.colors.error[600],
        info: tokens.colors.info[600],
        outline: tokens.semanticColors.text.primary,
        solid: tokens.semanticColors.background.primary,
      };
      return colorMap[variant || 'default'];
    };

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot: showDot }), className)}
        {...props}
      >
        {showDot && (
          <span
            style={{
              marginRight: tokens.spacing[2],
              height: '6px',
              width: '6px',
              borderRadius: '50%',
              backgroundColor: getDotColor(),
            }}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

/**
 * Badges pré-configurés pour les statuts de paiement
 */
export function PaymentStatusBadge({ status }: { status: 'PAYE' | 'IMPAYE' | 'PARTIEL' }) {
  const config = {
    PAYE: { variant: 'success' as const, label: 'Payé' },
    IMPAYE: { variant: 'danger' as const, label: 'Impayé' },
    PARTIEL: { variant: 'warning' as const, label: 'Partiel' },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} showDot>
      {label}
    </Badge>
  );
}

/**
 * Badge pré-configuré pour le niveau de stock
 */
export function StockLevelBadge({
  quantity,
  threshold,
}: {
  quantity: number;
  threshold: number;
}) {
  if (quantity === 0) {
    return (
      <Badge variant="danger" showDot>
        Rupture
      </Badge>
    );
  }

  if (quantity <= threshold) {
    return (
      <Badge variant="warning" showDot>
        Stock faible
      </Badge>
    );
  }

  return (
    <Badge variant="success" showDot>
      En stock
    </Badge>
  );
}
