'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter
} from 'lucide-react';

interface Produit {
  id: string;
  nom: string;
  prixAchat: number;
  prixVente: number;
  categorie: {
    nom: string;
  };
}

interface MouvementStock {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  motif: string;
  dateCreation: string;
  vente?: {
    numeroVente: string;
  };
}

interface Stock {
  id: string;
  quantite: number;
  seuilAlerte: number;
  dateCreation: string;
  dateModification: string;
  produit: Produit;
  mouvements: MouvementStock[];
}

interface StockForm {
  produitId: string;
  quantite: number;
  seuilAlerte: number;
}

interface MouvementForm {
  stockId: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  motif: string;
}

export default function StocksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMouvementForm, setShowMouvementForm] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [showDetails, setShowDetails] = useState<Stock | null>(null);
  const [showAlerteOnly, setShowAlerteOnly] = useState(false);
  const [stocksEnAlerte, setStocksEnAlerte] = useState(0);
  
  const [formData, setFormData] = useState<StockForm>({
    produitId: '',
    quantite: 0,
    seuilAlerte: 5,
  });

  const [mouvementData, setMouvementData] = useState<MouvementForm>({
    stockId: '',
    type: 'ENTREE',
    quantite: 1,
    motif: '',
  });

  const loadStocks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showAlerteOnly) params.append('alerte', 'true');
      
      const response = await fetch(`/api/stocks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStocks(data.stocks || []);
        setStocksEnAlerte(data.stocksEnAlerte || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stocks:', error);
    }
  }, [searchTerm, showAlerteOnly]);

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

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadStocks(), loadProduits()]);
      setLoading(false);
    };

    loadData();
  }, [session, status, router, loadStocks, loadProduits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingStock ? `/api/stocks/${editingStock.id}` : '/api/stocks';
      const method = editingStock ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadStocks();
        resetForm();
        alert(editingStock ? 'Stock mis à jour avec succès!' : 'Stock créé avec succès!');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleMouvementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/mouvements-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mouvementData),
      });

      if (response.ok) {
        await loadStocks();
        resetMouvementForm();
        alert('Mouvement de stock enregistré avec succès!');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l&apos;enregistrement du mouvement:', error);
      alert('Erreur lors de l&apos;enregistrement du mouvement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce stock?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stocks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadStocks();
        alert('Stock supprimé avec succès!');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      produitId: '',
      quantite: 0,
      seuilAlerte: 5,
    });
    setEditingStock(null);
    setShowForm(false);
  };

  const resetMouvementForm = () => {
    setMouvementData({
      stockId: '',
      type: 'ENTREE',
      quantite: 1,
      motif: '',
    });
    setShowMouvementForm(false);
  };

  const editStock = (stock: Stock) => {
    setFormData({
      produitId: stock.produit.id,
      quantite: stock.quantite,
      seuilAlerte: stock.seuilAlerte,
    });
    setEditingStock(stock);
    setShowForm(true);
  };

  const getStockStatus = (stock: Stock) => {
    if (stock.quantite <= stock.seuilAlerte) {
      return {
        status: 'Alerte',
        color: 'text-red-600 bg-red-100 border-red-200',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    } else if (stock.quantite <= stock.seuilAlerte * 2) {
      return {
        status: 'Faible',
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    } else {
      return {
        status: 'Normal',
        color: 'text-green-600 bg-green-100 border-green-200',
        icon: <Package className="w-4 h-4" />
      };
    }
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
            <Package className="w-8 h-8 text-blue-600" />
            Gestion des Stocks
          </h1>
          <p className="text-gray-600 mt-2">Suivez vos inventaires et mouvements de stock</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMouvementForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            Mouvement
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau Stock
          </button>
        </div>
      </div>

      {/* Alertes */}
      {stocksEnAlerte > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={20} />
            <span className="font-semibold">
              {stocksEnAlerte} produit(s) en alerte de stock faible
            </span>
            <button
              onClick={() => setShowAlerteOnly(!showAlerteOnly)}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              {showAlerteOnly ? 'Voir tous' : 'Voir les alertes'}
            </button>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom de produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAlerteOnly(!showAlerteOnly)}
          className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
            showAlerteOnly 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-5 h-5" />
          Alertes uniquement
        </button>
      </div>

      {/* Liste des stocks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seuil d&apos;alerte
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur stock
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map((stock) => {
                const status = getStockStatus(stock);
                const valeurStock = stock.quantite * stock.produit.prixAchat;
                
                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stock.produit.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.produit.categorie.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">{stock.quantite}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.seuilAlerte}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        {status.icon}
                        {status.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {valeurStock.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowDetails(stock)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editStock(stock)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stock.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun stock</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre premier stock.
            </p>
          </div>
        )}
      </div>

      {/* Modal de création/édition de stock */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingStock ? 'Modifier le stock' : 'Nouveau stock'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit *
                </label>
                <select
                  value={formData.produitId}
                  onChange={(e) => setFormData(prev => ({ ...prev, produitId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!editingStock}
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map((produit) => (
                    <option key={produit.id} value={produit.id}>
                      {produit.nom} - {produit.categorie.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantite}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil d&apos;alerte *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.seuilAlerte}
                  onChange={(e) => setFormData(prev => ({ ...prev, seuilAlerte: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  {editingStock ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de mouvement de stock */}
      {showMouvementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Nouveau mouvement de stock
              </h2>
            </div>
            
            <form onSubmit={handleMouvementSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <select
                  value={mouvementData.stockId}
                  onChange={(e) => setMouvementData(prev => ({ ...prev, stockId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.produit.nom} (Qté: {stock.quantite})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de mouvement *
                </label>
                <select
                  value={mouvementData.type}
                  onChange={(e) => setMouvementData(prev => ({ ...prev, type: e.target.value as 'ENTREE' | 'SORTIE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ENTREE">Entrée</option>
                  <option value="SORTIE">Sortie</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité *
                </label>
                <input
                  type="number"
                  min="1"
                  value={mouvementData.quantite}
                  onChange={(e) => setMouvementData(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif *
                </label>
                <input
                  type="text"
                  value={mouvementData.motif}
                  onChange={(e) => setMouvementData(prev => ({ ...prev, motif: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Réapprovisionnement, Ajustement inventaire..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetMouvementForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  Enregistrer
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
                  Détails du stock - {showDetails.produit.nom}
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
                  <label className="block text-sm font-medium text-gray-500">Produit</label>
                  <p className="text-sm text-gray-900">{showDetails.produit.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Catégorie</label>
                  <p className="text-sm text-gray-900">{showDetails.produit.categorie.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Quantité actuelle</label>
                  <p className="text-sm text-gray-900 font-semibold">{showDetails.quantite}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Seuil d&apos;alerte</label>
                  <p className="text-sm text-gray-900">{showDetails.seuilAlerte}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prix d&apos;achat</label>
                  <p className="text-sm text-gray-900">{showDetails.produit.prixAchat.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Valeur du stock</label>
                  <p className="text-sm text-gray-900 font-semibold">
                    {(showDetails.quantite * showDetails.produit.prixAchat).toLocaleString()} FCFA
                  </p>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Statut</label>
                <div className="inline-flex">
                  {(() => {
                    const status = getStockStatus(showDetails);
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                        {status.icon}
                        {status.status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Mouvements récents */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Mouvements récents</h3>
                {showDetails.mouvements.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantité
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Motif
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {showDetails.mouvements.map((mouvement) => (
                          <tr key={mouvement.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(mouvement.dateCreation).toLocaleDateString('fr-FR')}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                mouvement.type === 'ENTREE' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {mouvement.type === 'ENTREE' ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {mouvement.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                              {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {mouvement.motif}
                              {mouvement.vente && (
                                <span className="text-gray-500 text-xs block">
                                  Vente: {mouvement.vente.numeroVente}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun mouvement enregistré</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}