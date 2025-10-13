'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Package, Building2, Calendar,
  DollarSign, FileText, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Fournisseur {
  id: string;
  nom: string;
  prenom?: string;
  entreprise?: string;
}

interface Produit {
  id: string;
  nom: string;
  prixAchat: number;
  prixVente: number;
}

interface LigneCommande {
  produitId: string;
  quantite: number | string;
  prixUnitaire: number | string;
}

export default function NouvelleCommandePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fournisseurId: '',
    dateEcheance: '',
    notes: '',
    dateCommande: new Date().toISOString().split('T')[0], // Date actuelle par défaut
  });

  const [lignes, setLignes] = useState<LigneCommande[]>([]);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      redirect('/login');
    }
    if (session) {
      loadData();
    }
  }, [session, status]);

  const loadData = async () => {
    try {
      const [fournisseursRes, produitsRes] = await Promise.all([
        fetch('/api/fournisseurs'),
        fetch('/api/produits?limit=1000'),
      ]);

      if (fournisseursRes.ok) {
        const fournisseursData = await fournisseursRes.json();
        setFournisseurs(Array.isArray(fournisseursData) ? fournisseursData : []);
      }

      if (produitsRes.ok) {
        const produitsData = await produitsRes.json();
        const produitsArray = Array.isArray(produitsData?.produits)
          ? produitsData.produits
          : Array.isArray(produitsData)
          ? produitsData
          : [];
        setProduits(produitsArray);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const ajouterLigne = () => {
    setLignes([...lignes, { produitId: '', quantite: '', prixUnitaire: '' }]);
  };

  const supprimerLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const updateLigne = (index: number, field: keyof LigneCommande, value: string | number) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    // Auto-remplir le prix d'achat quand on sélectionne un produit
    if (field === 'produitId' && value) {
      const produit = produits.find((p) => p.id === value);
      if (produit) {
        newLignes[index].prixUnitaire = produit.prixAchat.toString();
      }
    }

    setLignes(newLignes);
  };

  const calculerMontantTotal = () => {
    return lignes.reduce((total, ligne) => {
      const quantite = typeof ligne.quantite === 'string' ? parseFloat(ligne.quantite) || 0 : ligne.quantite;
      const prix = typeof ligne.prixUnitaire === 'string' ? parseFloat(ligne.prixUnitaire) || 0 : ligne.prixUnitaire;
      return total + quantite * prix;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fournisseurId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (lignes.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    // Vérifier que toutes les lignes sont complètes
    const lignesInvalides = lignes.some((ligne) => {
      const quantite = typeof ligne.quantite === 'string' ? parseFloat(ligne.quantite) : ligne.quantite;
      const prix = typeof ligne.prixUnitaire === 'string' ? parseFloat(ligne.prixUnitaire) : ligne.prixUnitaire;
      return !ligne.produitId || isNaN(quantite) || quantite <= 0 || isNaN(prix) || prix < 0;
    });
    if (lignesInvalides) {
      toast.error('Veuillez compléter toutes les lignes de la commande avec des valeurs valides');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fournisseurId: formData.fournisseurId,
          dateEcheance: formData.dateEcheance || null,
          notes: formData.notes || null,
          dateCommande: formData.dateCommande,
          lignes: lignes.map((ligne) => {
            const quantite = typeof ligne.quantite === 'string' ? parseFloat(ligne.quantite) : ligne.quantite;
            const prixUnitaire = typeof ligne.prixUnitaire === 'string' ? parseFloat(ligne.prixUnitaire) : ligne.prixUnitaire;
            return {
              produitId: ligne.produitId,
              quantite: quantite,
              prixUnitaire: prixUnitaire,
            };
          }),
        }),
      });

      if (response.ok) {
        toast.success('Commande créée avec succès!');
        router.push('/boutique/commandes');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux commandes
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          Nouvelle Commande Fournisseur
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Créez une nouvelle commande auprès d&apos;un fournisseur
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fournisseurId}
                onChange={(e) => setFormData({ ...formData, fournisseurId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Sélectionnez un fournisseur</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom} {f.prenom}
                    {f.entreprise && ` - ${f.entreprise}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de la commande
              </label>
              <input
                type="date"
                value={formData.dateCommande}
                onChange={(e) => setFormData({ ...formData, dateCommande: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d&apos;échéance (optionnel)
              </label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Ajoutez des notes concernant cette commande..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Produits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6" />
              Produits à commander ({lignes.length})
            </h2>
            <button
              type="button"
              onClick={ajouterLigne}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter un produit
            </button>
          </div>

          {lignes.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucun produit ajouté à la commande
              </p>
              <button
                type="button"
                onClick={ajouterLigne}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Ajouter votre premier produit
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {lignes.map((ligne, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Produit
                      </label>
                      <select
                        value={ligne.produitId}
                        onChange={(e) => updateLigne(index, 'produitId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Sélectionnez un produit</option>
                        {produits.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantité
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite || ''}
                        onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix unitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ligne.prixUnitaire || ''}
                        onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sous-total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-white">
                        {(() => {
                          const quantite = typeof ligne.quantite === 'string' ? parseFloat(ligne.quantite) || 0 : ligne.quantite;
                          const prix = typeof ligne.prixUnitaire === 'string' ? parseFloat(ligne.prixUnitaire) || 0 : ligne.prixUnitaire;
                          return (quantite * prix).toLocaleString();
                        })()} F
                      </div>
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => supprimerLigne(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lignes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Montant total de la commande
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {calculerMontantTotal().toLocaleString()} FCFA
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting || lignes.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Création en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Créer la commande
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
