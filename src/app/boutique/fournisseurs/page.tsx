'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { exportClientsToExcel, exportClientsToCSV } from '@/lib/export';

interface Fournisseur {
  id: string;
  nom: string;
  prenom?: string;
  entreprise?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  notes?: string;
  _count: {
    commandes: number;
  };
}

interface FormData {
  nom: string;
  prenom: string;
  entreprise: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  notes: string;
}

export default function FournisseursPage() {
  const { data: session, status } = useSession();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    entreprise: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    pays: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFournisseurs();
  }, []);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session) redirect('/login');

  const loadFournisseurs = async () => {
    try {
      const response = await fetch('/api/fournisseurs');
      if (response.ok) {
        const data = await response.json();
        setFournisseurs(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email invalide';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingFournisseur
        ? `/api/fournisseurs/${editingFournisseur.id}`
        : '/api/fournisseurs';
      const method = editingFournisseur ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadFournisseurs();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      prenom: fournisseur.prenom || '',
      entreprise: fournisseur.entreprise || '',
      telephone: fournisseur.telephone || '',
      email: fournisseur.email || '',
      adresse: fournisseur.adresse || '',
      ville: fournisseur.ville || '',
      pays: fournisseur.pays || '',
      notes: fournisseur.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;

    try {
      const response = await fetch(`/api/fournisseurs/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadFournisseurs();
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
      prenom: '',
      entreprise: '',
      telephone: '',
      email: '',
      adresse: '',
      ville: '',
      pays: '',
      notes: '',
    });
    setEditingFournisseur(null);
    setErrors({});
  };

  const filteredFournisseurs = fournisseurs.filter((f) =>
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.telephone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            Gestion des Fournisseurs
          </h1>
          <p className="text-gray-600 mt-2">Gérez vos fournisseurs et leurs commandes</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <ExportButton
            onExportExcel={() => exportClientsToExcel(fournisseurs as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            onExportCSV={() => exportClientsToCSV(fournisseurs as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            disabled={fournisseurs.length === 0}
          />
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouveau Fournisseur
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, entreprise, email, téléphone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFournisseurs.map((fournisseur) => (
          <div
            key={fournisseur.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {fournisseur.nom} {fournisseur.prenom}
                </h3>
                {fournisseur.entreprise && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" />
                    {fournisseur.entreprise}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(fournisseur)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(fournisseur.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {fournisseur.telephone && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {fournisseur.telephone}
                </p>
              )}
              {fournisseur.email && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {fournisseur.email}
                </p>
              )}
              {fournisseur.adresse && (
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {fournisseur.adresse}
                  {fournisseur.ville && `, ${fournisseur.ville}`}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {fournisseur._count.commandes} commande{fournisseur._count.commandes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredFournisseurs.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun fournisseur trouvé</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.entreprise}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingFournisseur ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
