'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ExportButton from '@/components/ExportButton';
import { exportProduitsToExcel, exportProduitsToCSV } from '@/lib/export';
import FormField from '@/components/FormField';
import { useRealtimeValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

interface Categorie {
  id: string;
  nom: string;
  description?: string;
}

interface Produit {
  id: string;
  nom: string;
  description?: string;
  prixAchat: number;
  prixVente: number;
  seuilAlerte: number;
  categorieId: string;
  categorie: Categorie;
  quantiteStock: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nom: string;
  description: string;
  prixAchat: string;
  prixVente: string;
  seuilAlerte: string;
  categorieId: string;
}

// Schéma de validation pour les produits
const validationSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  prixAchat: z.string()
    .min(1, 'Le prix d\'achat est requis')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Le prix d\'achat doit être un nombre positif'),
  prixVente: z.string()
    .min(1, 'Le prix de vente est requis')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Le prix de vente doit être un nombre positif'),
  seuilAlerte: z.string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, 'Le seuil d\'alerte doit être un nombre positif ou zéro'),
  categorieId: z.string()
    .min(1, 'La catégorie est requise')
});

export default function ProduitsPage() {
  const { data: session, status } = useSession();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    description: '',
    prixAchat: '',
    prixVente: '',
    seuilAlerte: '5',
    categorieId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook de validation en temps réel
  const { 
    errors: validationErrors, 
    validateField, 
    validateForm, 
    isValid 
  } = useRealtimeValidation(validationSchema);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  // Redirection si non connecté
  if (status === 'loading') return <div>Chargement...</div>;
  if (!session) redirect('/login');

  const loadData = async () => {
    try {
      const [produitsRes, categoriesRes] = await Promise.all([
        fetch('/api/produits'),
        fetch('/api/categories'),
      ]);

      if (produitsRes.ok && categoriesRes.ok) {
        const produitsData = await produitsRes.json();
        const categoriesData = await categoriesRes.json();

        // Validation robuste des données
        const produits = Array.isArray(produitsData?.produits)
          ? produitsData.produits
          : (Array.isArray(produitsData) ? produitsData : []);

        const categories = Array.isArray(categoriesData?.categories)
          ? categoriesData.categories
          : (Array.isArray(categoriesData) ? categoriesData : []);

        setProduits(produits);
        setCategories(categories);
      } else {
        console.error('Erreur API:', {
          produitsStatus: produitsRes.status,
          categoriesStatus: categoriesRes.status
        });
        setProduits([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setProduits([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation avec le hook de validation en temps réel
    const isFormValid = validateForm(formData);
    if (!isFormValid) {
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
        prixAchat: parseFloat(formData.prixAchat),
        prixVente: parseFloat(formData.prixVente),
        seuilAlerte: parseInt(formData.seuilAlerte) || 5,
        categorieId: formData.categorieId,
      };

      const url = editingProduct ? `/api/produits/${editingProduct.id}` : '/api/produits';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadData();
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

  const handleEdit = (produit: Produit) => {
    setEditingProduct(produit);
    setFormData({
      nom: produit.nom,
      description: produit.description ?? '',
      prixAchat: produit.prixAchat.toString(),
      prixVente: produit.prixVente.toString(),
      seuilAlerte: produit.seuilAlerte.toString(),
      categorieId: produit.categorieId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const response = await fetch(`/api/produits/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prixAchat: '',
      prixVente: '',
      seuilAlerte: '5',
      categorieId: '',
    });
    setEditingProduct(null);
    setErrors({});
  };

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (produit.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || produit.categorieId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
        <div className="flex gap-3">
          <ExportButton
            onExportExcel={() => exportProduitsToExcel(produits as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            onExportCSV={() => exportProduitsToCSV(produits as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            disabled={produits.length === 0}
          />
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom ou description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProduits.map((produit) => (
                <tr key={produit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                      {produit.description && (
                        <div className="text-sm text-gray-500">{produit.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {produit.categorie.nom}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Achat: {produit.prixAchat.toFixed(2)} FCFA</div>
                    <div>Vente: {produit.prixVente.toFixed(2)} FCFA</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      produit.quantiteStock <= produit.seuilAlerte 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {produit.quantiteStock} unités
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(produit)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(produit.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProduits.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun produit trouvé
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Nom du produit"
                type="text"
                value={formData.nom}
                onChange={(value) => {
                  setFormData({ ...formData, nom: value });
                  validateField('nom', value);
                }}
                error={validationErrors.nom}
                required
                leftIcon="📦"
                placeholder="Nom du produit"
              />

              <FormField
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={(value) => {
                  setFormData({ ...formData, description: value });
                  validateField('description', value);
                }}
                error={validationErrors.description}
                leftIcon="📝"
                placeholder="Description du produit (optionnel)"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Prix d'achat"
                  type="number"
                  value={formData.prixAchat}
                  onChange={(value) => {
                    setFormData({ ...formData, prixAchat: value });
                    validateField('prixAchat', value);
                  }}
                  error={validationErrors.prixAchat}
                  required
                  leftIcon="💰"
                  placeholder="0.00"
                  step="0.01"
                />

                <FormField
                  label="Prix de vente"
                  type="number"
                  value={formData.prixVente}
                  onChange={(value) => {
                    setFormData({ ...formData, prixVente: value });
                    validateField('prixVente', value);
                  }}
                  error={validationErrors.prixVente}
                  required
                  leftIcon="💵"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Seuil d'alerte"
                  type="number"
                  value={formData.seuilAlerte}
                  onChange={(value) => {
                    setFormData({ ...formData, seuilAlerte: value });
                    validateField('seuilAlerte', value);
                  }}
                  error={validationErrors.seuilAlerte}
                  leftIcon="⚠️"
                  placeholder="5"
                />

                <FormField
                  label="Catégorie"
                  type="select"
                  value={formData.categorieId}
                  onChange={(value) => {
                    setFormData({ ...formData, categorieId: value });
                    validateField('categorieId', value);
                  }}
                  error={validationErrors.categorieId}
                  required
                  leftIcon="🏷️"
                  options={[
                    { value: '', label: 'Sélectionner...' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.nom }))
                  ]}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}