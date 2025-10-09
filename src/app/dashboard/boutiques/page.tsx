'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Boutique } from '@/types';
import { formatMontant } from '@/lib/utils';

interface BoutiqueWithStats extends Boutique {
  stats?: {
    totalVentes: number;
    totalImpayes: number;
    nombreUsers: number;
    nombreProduits: number;
    nombreVentes: number;
    nombreClients: number;
  };
}

interface FormData {
  nom: string;
  adresse: string;
  telephone: string;
  description: string;
}

export default function BoutiquesPage() {
  const { data: session, status } = useSession();
  const [boutiques, setBoutiques] = useState<BoutiqueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState<BoutiqueWithStats | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    adresse: '',
    telephone: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBoutiques();
  }, []);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  const loadBoutiques = async () => {
    try {
      const response = await fetch('/api/boutiques?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setBoutiques(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des boutiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.nom.trim()) {
      setErrors({ nom: 'Le nom est requis' });
      return;
    }

    try {
      const url = editingBoutique ? `/api/boutiques/${editingBoutique.id}` : '/api/boutiques';
      const method = editingBoutique ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadBoutiques();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error('Erreur:', errorData);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (boutique: BoutiqueWithStats) => {
    setEditingBoutique(boutique);
    setFormData({
      nom: boutique.nom,
      adresse: boutique.adresse || '',
      telephone: boutique.telephone || '',
      description: boutique.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) return;

    try {
      const response = await fetch(`/api/boutiques/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadBoutiques();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', adresse: '', telephone: '', description: '' });
    setEditingBoutique(null);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Boutiques</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ajouter une boutique
        </button>
      </div>

      {/* Liste des boutiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boutiques.map((boutique) => (
          <div key={boutique.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
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

            {boutique.stats && boutique.stats.totalImpayes > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-4">
                <p className="text-xs text-red-600">
                  Impayés: {formatMontant(boutique.stats.totalImpayes)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(boutique)}
                className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(boutique.id)}
                className="flex-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {boutiques.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune boutique. Cliquez sur &quot;Ajouter une boutique&quot; pour commencer.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingBoutique ? 'Modifier la boutique' : 'Ajouter une boutique'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
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
                  {editingBoutique ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
