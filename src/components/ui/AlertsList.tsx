import React from 'react';
import Link from 'next/link';
import { AlertCircle, LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface Alert {
  produit: string;
  boutique: string;
  quantite: number;
  seuil: number;
}

interface AlertsListProps {
  title: string;
  alerts: Alert[];
  alertCount: number;
  viewAllHref?: string;
  icon?: LucideIcon;
  className?: string;
}

export function AlertsList({ 
  title, 
  alerts, 
  alertCount, 
  viewAllHref, 
  icon: Icon = AlertCircle,
  className = '' 
}: AlertsListProps) {
  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="text-orange-500" size={20} />
        <span>{title} ({alertCount})</span>
      </h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune alerte de stock</p>
        ) : (
          alerts.map((alert, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div>
                <p className="font-medium text-gray-900">{alert.produit}</p>
                <p className="text-sm text-gray-600">{alert.boutique}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-600 font-semibold">{alert.quantite} / {alert.seuil}</p>
                <p className="text-xs text-gray-500">Stock actuel / Seuil</p>
              </div>
            </div>
          ))
        )}
      </div>
      {alerts.length > 0 && viewAllHref && (
        <Link
          href={viewAllHref}
          className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Voir tous les stocks →
        </Link>
      )}
    </Card>
  );
}