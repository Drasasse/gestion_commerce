/**
 * PageHeader Component
 *
 * Composant d'en-tête de page utilisant le design system
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useDesignTokens } from '@/hooks/useDesignTokens';

export interface PageHeaderProps {
  /** Titre principal de la page */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Actions optionnelles (boutons, etc.) */
  actions?: React.ReactNode;
  /** Breadcrumb optionnel */
  breadcrumb?: React.ReactNode;
  /** Classe CSS personnalisée */
  className?: string;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, breadcrumb, className, ...props }, ref) => {
    const tokens = useDesignTokens();

    const containerStyles = {
      padding: tokens.spacing[6],
      backgroundColor: tokens.semanticColors.background.primary,
      borderBottom: `1px solid ${tokens.semanticColors.border.primary}`,
    };

    const breadcrumbStyles = {
      marginBottom: tokens.spacing[4],
    };

    const headerRowStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: tokens.spacing[4],
    };

    const titleSectionStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: tokens.spacing[1],
    };

    const titleStyles = {
      fontSize: tokens.fontSize['2xl'][0],
      fontWeight: tokens.fontWeight.bold,
      color: tokens.colors.gray[900],
      lineHeight: tokens.fontSize['2xl'][1].lineHeight,
      margin: 0,
    };

    const descriptionStyles = {
      fontSize: tokens.fontSize.base[0],
      color: tokens.colors.gray[600],
      lineHeight: tokens.fontSize.base[1].lineHeight,
      margin: 0,
    };

    const actionsStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing[3],
      flexShrink: 0,
    };

    return (
      <div 
        ref={ref}
        className={cn('page-header', className)}
        style={containerStyles}
        {...props}
      >
        {breadcrumb && (
          <div style={breadcrumbStyles}>
            {breadcrumb}
          </div>
        )}
        
        <div style={headerRowStyles} className="sm:flex-row sm:items-center sm:justify-between">
          <div style={titleSectionStyles}>
            <h1 style={titleStyles}>
              {title}
            </h1>
            {description && (
              <p style={descriptionStyles}>
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div style={actionsStyles}>
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export default PageHeader;