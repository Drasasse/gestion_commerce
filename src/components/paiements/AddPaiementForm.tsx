'use client';

import { useState } from 'react';
import { Paiement } from '@/types';

interface AddPaiementFormProps {
  venteId: number;
  montantRestant: number;
  onPaiementAdded: (paiement: Paiement) => void;
  onCancel: () => void;
}

const METHODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'mobile', label: 'Paiement mobile' }
];

export default function AddPaiementForm({ 
  venteId, 
  montantRestant, 
  onPaiementAdded, 
  onCancel 
}: AddPaiementFormProps) {
  const [formData, setFormData] = useState({
    montant: montantRestant,
    methodePaiement: 'especes',
    reference: '',
    datePaiement: new Date().toISOString().slice(0, 16) // Format datetime-local
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }
    
    if (formData.montant > montantRestant) {
      setError(`Le montant ne peut pas dépasser le montant restant (${montantRestant.toLocaleString()} FCFA)`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          venteId,
          datePaiement: new Date(formData.datePaiement).toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du paiement');
      }

      const nouveauPaiement = await response.json();
      onPaiementAdded(nouveauPaiement);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleMontantChange = (value: string) => {
    const montant = parseFloat(value) || 0;
    setFormData({ ...formData, montant });
    if (error && montant > 0 && montant <= montantRestant) {
      setError('');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Ajouter un paiement
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Montant restant à payer:</span> {montantRestant.toLocaleString()} FCFA
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
            Montant (FCFA) *
          </label>
          <input
            type="number"
            id="montant"
            min="0"
            max={montantRestant}
            step="0.01"
            value={formData.montant}
            onChange={(e) => handleMontantChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="methodePaiement" className="block text-sm font-medium text-gray-700 mb-1">
            Méthode de paiement *
          </label>
          <select
            id="methodePaiement"
            value={formData.methodePaiement}
            onChange={(e) => setFormData({ ...formData, methodePaiement: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {METHODES_PAIEMENT.map((methode) => (
              <option key={methode.value} value={methode.value}>
                {methode.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="datePaiement" className="block text-sm font-medium text-gray-700 mb-1">
            Date et heure du paiement *
          </label>
          <input
            type="datetime-local"
            id="datePaiement"
            value={formData.datePaiement}
            onChange={(e) => setFormData({ ...formData, datePaiement: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
            Référence (optionnel)
          </label>
          <input
            type="text"
            id="reference"
            placeholder="Numéro de transaction, référence chèque, etc."
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ajout en cours...
              </div>
            ) : (
              'Ajouter le paiement'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>* Champs obligatoires</p>
      </div>
    </div>
  );
}