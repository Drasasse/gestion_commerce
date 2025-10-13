'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Categorie {
  id: string;
  nom: string;
  description?: string;
  _count: {
    produits: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nom: string;
  description: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?includeCount=true');
      if (response.ok) {
        const data = await response.json();
        // L'API retourne {categories: [...]}
        const categoriesArray = Array.isArray(data?.categories) ? data.categories : (Array.isArray(data) ? data : []);
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les catégories
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Redirection si non connecté
  if (status === 'loading') return <div>Chargement...</div>;
  if (!session) redirect('/login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
      };

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadCategories();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        if (errorData.error?.includes('déjà')) {
          setErrors({ nom: 'Cette catégorie existe déjà' });
        } else {
          console.error('Erreur:', errorData);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (categorie: Categorie) => {
    setEditingCategory(categorie);
    setFormData({
      nom: categorie.nom,
      description: categorie.description ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, nom: string, produitsCount: number) => {
    if (produitsCount > 0) {
      alert(`Impossible de supprimer la catégorie "${nom}" car elle contient ${produitsCount} produit(s).`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${nom}" ?`)) return;

    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadCategories();
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
    });
    setEditingCategory(null);
    setErrors({});
  };

  const filteredCategories = categories.filter(categorie =>
    categorie.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categorie.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="page-title">Gestion des Catégories</h1>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter une catégorie
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

          {/* Liste des catégories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((categorie) => (
              <div key={categorie.id} className="stats-card">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-card-foreground">{categorie.nom}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {categorie._count?.produits || 0} produit{(categorie._count?.produits || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {categorie.description && (
                  <p className="text-muted-foreground text-sm mb-4">{categorie.description}</p>
                )}
                
                <div className="text-xs text-muted-foreground mb-4">
                  Créée le {new Date(categorie.createdAt).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(categorie)}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(categorie.id, categorie.nom, categorie._count?.produits || 0)}
                    className={`text-sm font-medium ${
                      (categorie._count?.produits || 0) > 0 
                        ? 'text-muted-foreground cursor-not-allowed' 
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    disabled={(categorie._count?.produits || 0) > 0}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">Aucune catégorie trouvée</div>
              <p className="text-muted-foreground/70">Commencez par créer votre première catégorie</p>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
              <div className="modal-content rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">
                  {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="form-label">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className={`form-input ${errors.nom ? 'error' : ''}`}
                    />
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="form-input resize-none"
                      placeholder="Description optionnelle de la catégorie..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary px-4 py-2 rounded-md transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {editingCategory ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}