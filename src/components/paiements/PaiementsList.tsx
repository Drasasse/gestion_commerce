'use client';

import { useState, useEffect } from 'react';
import { Paiement } from '@/types';

interface PaiementsListProps {
  venteId: number;
  onPaiementDeleted?: () => void;
}

export default function PaiementsList({ venteId, onPaiementDeleted }: PaiementsListProps) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPaiements = async () => {
    try {
      const response = await fetch(`/api/paiements?venteId=${venteId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paiements');
      }
      const data = await response.json();
      setPaiements(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, [venteId]);

  const handleDelete = async (paiementId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return;
    }

    setDeletingId(paiementId);
    try {
      const response = await fetch(`/api/paiements/${paiementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setPaiements(paiements.filter(p => p.id !== paiementId));
      onPaiementDeleted?.();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getMethodePaiementLabel = (methode: string) => {
    const labels: { [key: string]: string } = {
      especes: 'Espèces',
      carte: 'Carte bancaire',
      virement: 'Virement',
      cheque: 'Chèque',
      mobile: 'Paiement mobile'
    };
    return labels[methode] || methode;
  };

  const getMethodePaiementColor = (methode: string) => {
    const colors: { [key: string]: string } = {
      especes: 'bg-green-100 text-green-800',
      carte: 'bg-blue-100 text-blue-800',
      virement: 'bg-purple-100 text-purple-800',
      cheque: 'bg-yellow-100 text-yellow-800',
      mobile: 'bg-indigo-100 text-indigo-800'
    };
    return colors[methode] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (paiements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun paiement enregistré pour cette vente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Historique des paiements ({paiements.length})
      </h3>
      
      <div className="space-y-3">
        {paiements.map((paiement) => (
          <div
            key={paiement.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {paiement.montant.toLocaleString()} FCFA
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodePaiementColor(paiement.methodePaiement)}`}>
                    {getMethodePaiementLabel(paiement.methodePaiement)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Date: {new Date(paiement.datePaiement).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {paiement.reference && (
                    <div>
                      Référence: <span className="font-medium">{paiement.reference}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(paiement.id)}
                disabled={deletingId === paiement.id}
                className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Supprimer ce paiement"
              >
                {deletingId === paiement.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Résumé */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total des paiements:</span>
            <span className="font-semibold text-gray-900">
              {paiements.reduce((sum, p) => sum + p.montant, 0).toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}