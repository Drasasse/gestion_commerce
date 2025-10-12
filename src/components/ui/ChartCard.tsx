/**
 * ChartCard Component
 *
 * Composant de carte pour les graphiques utilisant le design system
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  /** Titre du graphique */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Contenu du graphique */
  children: React.ReactNode;
  /** Classe CSS personnalisée */
  className?: string;
  /** Actions optionnelles dans le header */
  actions?: React.ReactNode;
}

export const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  ({ title, description, children, className, actions, ...props }, ref) => {
    return (
      <Card 
        ref={ref}
        variant="default"
        padding="none"
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    );
  }
);

ChartCard.displayName = 'ChartCard';

export default ChartCard;