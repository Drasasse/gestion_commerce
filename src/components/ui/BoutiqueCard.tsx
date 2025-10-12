import React from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { formatMontant } from '@/lib/utils';
import { Boutique } from '@/types';

interface BoutiqueStats {
  totalVentes: number;
  totalImpayes: number;
  nombreUsers: number;
  nombreProduits: number;
  nombreVentes: number;
  nombreClients: number;
}

interface BoutiqueWithStats extends Boutique {
  stats?: BoutiqueStats;
}

interface BoutiqueCardProps {
  boutique: BoutiqueWithStats;
  onEdit: (boutique: Boutique) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function BoutiqueCard({ boutique, onEdit, onDelete, className = '' }: BoutiqueCardProps) {
  return (
    <Card className={className}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{boutique.nom}</h3>
          {boutique.adresse && (
            <p className="text-sm text-gray-600 mt-1">{boutique.adresse}</p>
          )}
          {boutique.telephone && (
            <p className="text-sm text-gray-600">{boutique.telephone}</p>
          )}
        </div>
      </div>

      {boutique.description && (
        <p className="text-sm text-gray-600 mb-4">{boutique.description}</p>
      )}

      {boutique.stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Ventes</p>
            <p className="text-lg font-bold text-blue-900">{boutique.stats.nombreVentes}</p>
            <p className="text-xs text-blue-600">{formatMontant(boutique.stats.totalVentes)}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Produits</p>
            <p className="text-lg font-bold text-green-900">{boutique.stats.nombreProduits}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Utilisateurs</p>
            <p className="text-lg font-bold text-purple-900">{boutique.stats.nombreUsers}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">Clients</p>
            <p className="text-lg font-bold text-orange-900">{boutique.stats.nombreClients}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(boutique)}
          className="flex-1"
        >
          <Edit size={16} className="mr-1" />
          Modifier
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(boutique.id)}
          className="flex-1"
        >
          <Trash2 size={16} className="mr-1" />
          Supprimer
        </Button>
        <Link href={`/dashboard/boutiques/${boutique.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            <Eye size={16} className="mr-1" />
            Voir
          </Button>
        </Link>
      </div>
    </Card>
  );
}