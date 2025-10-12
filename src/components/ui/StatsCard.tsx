/**
 * StatsCard Component
 *
 * Composant de carte de statistiques utilisant le design system
 */

import * as React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  /** Titre de la statistique */
  title: string;
  /** Valeur affichée (formatée) */
  value: string | number;
  /** Valeur complète pour le tooltip */
  fullValue?: string;
  /** Icône à afficher */
  icon: LucideIcon;
  /** Couleur de l'icône */
  iconColor?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  /** Tendance en pourcentage */
  trend?: number;
  /** Description optionnelle */
  description?: string;
  /** Classe CSS personnalisée */
  className?: string;
}

const iconColorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
};

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ 
    title, 
    value, 
    fullValue, 
    icon: Icon, 
    iconColor = 'blue', 
    trend, 
    description, 
    className,
    ...props 
  }, ref) => {
    const hasTrend = trend !== undefined && trend !== 0;
    const trendUp = trend ? trend > 0 : false;
    const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

    return (
      <Card 
        ref={ref}
        variant="default"
        padding="md"
        hover
        className={cn("transition-shadow", className)}
        {...props}
      >
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "p-3 rounded-lg",
              iconColorClasses[iconColor]
            )}>
              <Icon className="text-white" size={24} />
            </div>
            {hasTrend && (
              <Badge 
                variant={trendUp ? "success" : "danger"}
                size="sm"
                className="flex items-center gap-1"
              >
                <TrendIcon size={12} />
                <span>{Math.abs(trend!)}%</span>
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p 
              className="text-2xl font-bold text-gray-900" 
              title={fullValue || value.toString()}
            >
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;