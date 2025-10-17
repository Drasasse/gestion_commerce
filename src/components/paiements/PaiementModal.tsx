'use client';

import { useState } from 'react';
import { Vente } from '@/types';

interface PaiementModalProps {
  vente: Vente;
  isOpen: boolean;
  onClose: () => void;
  onPaiementAdded: () => void;
}

export default function PaiementModal({ vente, isOpen, onClose, onPaiementAdded }: PaiementModalProps) {
  const [montant, setMontant] = useState('');
  const [methodePaiement, setMethodePaiement] = useState('especes');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const montantNum = parseFloat(montant);
      
      if (isNaN(montantNum) || montantNum <= 0) {
        setError('Le montant doit être un nombre positif');
        return;
      }

      if (montantNum > vente.montantRestant) {
        setError('Le montant ne peut pas dépasser le montant restant');
        return;
      }

      const response = await fetch('/api/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venteId: vente.id,
          montant: montantNum,
          methodePaiement,
          reference: reference || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du paiement');
      }

      // Réinitialiser le formulaire
      setMontant('');
      setMethodePaiement('especes');
      setReference('');
      
      onPaiementAdded();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Ajouter un paiement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations de la vente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Vente #{vente.id}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Montant total: {vente.montantTotal.toLocaleString()} FCFA</div>
              <div>Montant payé: {vente.montantPaye.toLocaleString()} FCFA</div>
              <div className="font-medium text-red-600">
                Montant restant: {vente.montantRestant.toLocaleString()} FCFA
              </div>
            </div>
          </div>

          {/* Montant du paiement */}
          <div>
            <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
              Montant du paiement *
            </label>
            <input
              type="number"
              id="montant"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
              max={vente.montantRestant}
              step="0.01"
              required
            />
          </div>

          {/* Méthode de paiement */}
          <div>
            <label htmlFor="methodePaiement" className="block text-sm font-medium text-gray-700 mb-1">
              Méthode de paiement *
            </label>
            <select
              id="methodePaiement"
              value={methodePaiement}
              onChange={(e) => setMethodePaiement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="mobile">Paiement mobile</option>
            </select>
          </div>

          {/* Référence (optionnel) */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Référence (optionnel)
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numéro de transaction, référence chèque, etc."
            />
          </div>

          {/* Boutons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Ajout...' : 'Ajouter le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}