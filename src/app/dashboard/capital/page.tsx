'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatMontant, formatDate } from '@/lib/utils';

interface Boutique {
  id: string;
  nom: string;
  capitalInitial: number;
}

interface Transaction {
  id: string;
  montant: number;
  type: string;
  description: string;
  createdAt: string;
  boutique: {
    id: string;
    nom: string;
  };
}

interface CapitalStats {
  boutiqueId: string;
  boutiqueName: string;
  capitalInitial: number;
  totalInjections: number;
  capitalActuel: number;
  nombreInjections: number;
}

export default function CapitalPage() {
  const { data: session, status } = useSession();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [capitalStats, setCapitalStats] = useState<CapitalStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    boutiqueId: '',
    montant: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateCapitalStats = useCallback((boutiquesData: Boutique[], transactionsData: Transaction[]) => {
    const stats = boutiquesData.map(boutique => {
      const injections = transactionsData.filter(
        t => t.boutique.id === boutique.id && t.type === 'INJECTION_CAPITAL'
      );

      const totalInjections = injections.reduce((sum, t) => sum + t.montant, 0);

      return {
        boutiqueId: boutique.id,
        boutiqueName: boutique.nom,
        capitalInitial: boutique.capitalInitial,
        totalInjections,
        capitalActuel: boutique.capitalInitial + totalInjections,
        nombreInjections: injections.length,
      };
    });

    setCapitalStats(stats);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [boutiquesRes, transactionsRes] = await Promise.all([
        fetch('/api/boutiques'),
        fetch('/api/capital'),
      ]);

      if (boutiquesRes.ok && transactionsRes.ok) {
        const boutiquesData = await boutiquesRes.json();
        const transactionsData = await transactionsRes.json();

        setBoutiques(boutiquesData);
        setTransactions(transactionsData);
        calculateCapitalStats(boutiquesData, transactionsData);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [calculateCapitalStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.boutiqueId) newErrors.boutiqueId = 'La boutique est requise';
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (!formData.description.trim()) newErrors.description = 'La description est requise';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch('/api/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutiqueId: formData.boutiqueId,
          montant: parseFloat(formData.montant),
          description: formData.description,
        }),
      });

      if (response.ok) {
        toast.success('Injection de capital enregistrée');
        await loadData();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const resetForm = () => {
    setFormData({ boutiqueId: '', montant: '', description: '' });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalCapital = capitalStats.reduce((sum, stat) => sum + stat.capitalActuel, 0);
  const totalInjections = capitalStats.reduce((sum, stat) => sum + stat.totalInjections, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du Capital</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Injecter du capital
        </button>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Capital Total</p>
              <p className="text-3xl font-bold mt-2">{formatMontant(totalCapital)}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Injections</p>
              <p className="text-3xl font-bold mt-2">{formatMontant(totalInjections)}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Nombre de Boutiques</p>
              <p className="text-3xl font-bold mt-2">{boutiques.length}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Capital par boutique */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Capital par Boutique</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capitalStats.map(stat => (
              <div key={stat.boutiqueId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3">{stat.boutiqueName}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capital initial:</span>
                    <span className="font-medium">{formatMontant(stat.capitalInitial)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total injections:</span>
                    <span className="font-medium text-green-600">+{formatMontant(stat.totalInjections)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="text-gray-900 font-semibold">Capital actuel:</span>
                    <span className="font-bold text-blue-600">{formatMontant(stat.capitalActuel)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{stat.nombreInjections} injection(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historique des injections */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historique des Injections</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions
                .filter(t => t.type === 'INJECTION_CAPITAL')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.boutique.nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        +{formatMontant(transaction.montant)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.description}</div>
                    </td>
                  </tr>
                ))}
              {transactions.filter(t => t.type === 'INJECTION_CAPITAL').length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Aucune injection de capital enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'injection */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Injecter du Capital</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Boutique *</label>
                <select
                  value={formData.boutiqueId}
                  onChange={(e) => setFormData({ ...formData, boutiqueId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.boutiqueId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Sélectionner une boutique</option>
                  {boutiques.map(b => (
                    <option key={b.id} value={b.id}>{b.nom}</option>
                  ))}
                </select>
                {errors.boutiqueId && <p className="text-red-500 text-xs mt-1">{errors.boutiqueId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.montant ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.montant && <p className="text-red-500 text-xs mt-1">{errors.montant}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  rows={3}
                  placeholder="Ex: Injection initiale, Augmentation capital..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
