/**
 * PageHeader Component
 *
 * Composant d'en-tête de page utilisant le design system
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

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
    return (
      <div 
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {breadcrumb && (
          <div className="text-sm">
            {breadcrumb}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="page-title">
              {title}
            </h1>
            {description && (
              <p className="page-description">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
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