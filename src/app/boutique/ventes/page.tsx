'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { exportVentesToExcel, exportVentesToCSV } from '@/lib/export';
import FormField from '@/components/FormField';
import { useRealtimeValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

interface Produit {
  id: string;
  nom: string;
  prixVente: number;
  stocks: { quantite: number }[];
}

interface Client {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
}

interface LigneVente {
  id: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  produit: {
    nom: string;
    prixVente: number;
  };
}

interface Vente {
  id: string;
  numeroVente: string;
  dateVente: string;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'PAYE' | 'IMPAYE' | 'PARTIEL';
  clientId?: string;
  client?: Client;
  user: {
    name: string;
  };
  lignes: LigneVente[];
  [key: string]: unknown;
}

interface LigneVenteForm {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
}

interface VenteForm {
  clientId?: string;
  lignes: LigneVenteForm[];
  montantPaye: number;
  dateVente?: string;
}

// Schéma de validation pour les ventes
const validationSchema = {
  clientId: {
    // Optionnel, pas de validation requise
  },
  dateVente: {
    required: true,
    custom: (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return 'La date de vente est requise';
      const selectedDate = new Date(strValue);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin de journée
      if (selectedDate > today) return 'La date ne peut pas être dans le futur';
      return null;
    }
  },
  montantPaye: {
    required: true,
    custom: (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return 'Le montant payé est requis';
      const num = parseFloat(strValue);
      if (isNaN(num) || num < 0) return 'Le montant payé doit être positif ou zéro';
      return null;
    }
  }
};

export default function VentesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVente, setEditingVente] = useState<Vente | null>(null);
  const [showDetails, setShowDetails] = useState<Vente | null>(null);
  
  const [formData, setFormData] = useState<VenteForm>({
    clientId: '',
    lignes: [{ produitId: '', quantite: 1, prixUnitaire: 0 }],
    montantPaye: 0,
    dateVente: new Date().toISOString().split('T')[0], // Date du jour par défaut
  });

  // Hook de validation en temps réel
  const { 
    errors: validationErrors, 
    validateField, 
    validateForm, 
    isValid 
  } = useRealtimeValidation(validationSchema);

  const loadVentes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/ventes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVentes(data.ventes || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
    }
  }, [searchTerm]);

  const loadProduits = useCallback(async () => {
    try {
      const response = await fetch('/api/produits');
      if (response.ok) {
        const data = await response.json();
        setProduits(data.produits || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadVentes(), loadProduits(), loadClients()]);
      setLoading(false);
    };

    loadData();
  }, [session, status, router, loadVentes, loadProduits, loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingVente ? `/api/ventes/${editingVente.id}` : '/api/ventes';
      const method = editingVente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadVentes();
        resetForm();
        alert(editingVente ? 'Vente mise à jour avec succès!' : 'Vente créée avec succès!');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette vente? Cette action restaurera les stocks.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ventes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadVentes();
        alert('Vente annulée avec succès!');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l&apos;annulation:', error);
      alert('Erreur lors de l&apos;annulation');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      lignes: [{ produitId: '', quantite: 1, prixUnitaire: 0 }],
      montantPaye: 0,
      dateVente: new Date().toISOString().split('T')[0],
    });
    setEditingVente(null);
    setShowForm(false);
  };

  const addLigne = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { produitId: '', quantite: 1, prixUnitaire: 0 }]
    }));
  };

  const removeLigne = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const updateLigne = (index: number, field: keyof LigneVenteForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.map((ligne, i) => 
        i === index ? { ...ligne, [field]: value } : ligne
      )
    }));
  };

  const handleProduitChange = (index: number, produitId: string) => {
    const produit = produits.find(p => p.id === produitId);
    if (produit) {
      updateLigne(index, 'produitId', produitId);
      updateLigne(index, 'prixUnitaire', produit.prixVente);
    }
  };

  const calculateTotal = () => {
    return formData.lignes.reduce((total, ligne) => {
      return total + (ligne.quantite * ligne.prixUnitaire);
    }, 0);
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      PAYE: 'bg-green-100 text-green-800 border-green-200',
      IMPAYE: 'bg-red-100 text-red-800 border-red-200',
      PARTIEL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const icons = {
      PAYE: <CheckCircle className="w-3 h-3" />,
      IMPAYE: <AlertCircle className="w-3 h-3" />,
      PARTIEL: <Clock className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[statut as keyof typeof styles]}`}>
        {icons[statut as keyof typeof icons]}
        {statut}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Gestion des Ventes
          </h1>
          <p className="text-gray-600 mt-2">Gérez vos ventes et suivez les paiements</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            onExportExcel={() => exportVentesToExcel(ventes as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            onExportCSV={() => exportVentesToCSV(ventes as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            disabled={ventes.length === 0}
          />
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Vente
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par numéro de vente, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des ventes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant Payé
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendeur
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventes.map((vente) => (
                <tr key={vente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vente.numeroVente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(vente.dateVente).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      {vente.client ? `${vente.client.nom} ${vente.client.prenom || ''}`.trim() : 'Client anonyme'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      {vente.montantTotal.toLocaleString()} FCFA
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vente.montantPaye.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatutBadge(vente.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vente.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowDetails(vente)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vente.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Annuler la vente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ventes.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune vente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première vente.
            </p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVente ? 'Modifier la vente' : 'Nouvelle vente'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client */}
              <FormField
                label="Client (optionnel)"
                type="select"
                value={formData.clientId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, clientId: value }));
                  validateField('clientId', value);
                }}
                error={validationErrors.clientId}
                leftIcon="👤"
                options={[
                  { value: '', label: 'Sélectionner un client' },
                  ...clients.map((client) => ({
                    value: client.id,
                    label: `${client.nom} ${client.prenom || ''} ${client.email ? `(${client.email})` : ''}`
                  }))
                ]}
              />

              {/* Date de vente */}
              <FormField
                label="Date de vente"
                type="text"
                value={formData.dateVente || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, dateVente: value }));
                  validateField('dateVente', value);
                }}
                error={validationErrors.dateVente}
                required
                leftIcon="📅"
                helpText="Vous pouvez sélectionner une date passée pour enregistrer des ventes historiques"
                {...({ type: 'date' } as any)}
              />

              {/* Lignes de vente */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Produits
                  </label>
                  <button
                    type="button"
                    onClick={addLigne}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.lignes.map((ligne, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Produit</label>
                        <select
                          value={ligne.produitId}
                          onChange={(e) => handleProduitChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Sélectionner un produit</option>
                          {produits.map((produit) => (
                            <option key={produit.id} value={produit.id}>
                              {produit.nom} (Stock: {produit.stocks?.[0]?.quantite ?? 0})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500 mb-1">Prix unitaire</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ligne.prixUnitaire}
                          onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500 mb-1">Sous-total</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                          {(ligne.quantite * ligne.prixUnitaire).toLocaleString()} FCFA
                        </div>
                      </div>
                      {formData.lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLigne(index)}
                          className="text-red-600 hover:text-red-900 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total et paiement */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {calculateTotal().toLocaleString()} FCFA
                  </span>
                </div>

                <FormField
                  label="Montant payé"
                  type="number"
                  value={formData.montantPaye.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    const montant = parseFloat(value) || 0;
                    setFormData(prev => ({ ...prev, montantPaye: montant }));
                    validateField('montantPaye', value);
                  }}
                  error={validationErrors.montantPaye}
                  required
                  leftIcon="💰"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {editingVente ? 'Mettre à jour' : 'Créer la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Détails de la vente {showDetails.numeroVente}
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(showDetails.dateVente).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Vendeur</label>
                  <p className="text-sm text-gray-900">{showDetails.user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Client</label>
                  <p className="text-sm text-gray-900">
                    {showDetails.client ? 
                      `${showDetails.client.nom} ${showDetails.client.prenom || ''}`.trim() : 
                      'Client anonyme'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    {getStatutBadge(showDetails.statut)}
                  </div>
                </div>
              </div>

              {/* Lignes de vente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Produits vendus</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantité
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Prix unitaire
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Sous-total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {showDetails.lignes.map((ligne) => (
                        <tr key={ligne.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {ligne.produit.nom}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {ligne.quantite}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {ligne.prixUnitaire.toLocaleString()} FCFA
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {ligne.sousTotal.toLocaleString()} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Résumé financier */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant total:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {showDetails.montantTotal.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant payé:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {showDetails.montantPaye.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Montant restant:</span>
                    <span className={`text-sm font-bold ${showDetails.montantRestant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {showDetails.montantRestant.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}