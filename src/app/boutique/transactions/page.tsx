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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Wallet,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

interface Vente {
  numeroVente: string;
  client?: {
    nom: string;
    prenom: string;
  };
}

interface Transaction {
  id: string;
  type: 'RECETTE' | 'DEPENSE';
  montant: number;
  description: string;
  categorie: string;
  dateTransaction: string;
  dateCreation: string;
  vente?: Vente;
}

interface TransactionForm {
  type: 'RECETTE' | 'DEPENSE';
  montant: number;
  description: string;
  categorie: string;
  dateTransaction: string;
}

interface Stats {
  recettesMois: number;
  depensesMois: number;
  beneficeMois: number;
  solde: number;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    recettesMois: 0,
    depensesMois: 0,
    beneficeMois: 0,
    solde: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TOUS' | 'RECETTE' | 'DEPENSE'>('TOUS');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState<TransactionForm>({
    type: 'RECETTE',
    montant: 0,
    description: '',
    categorie: '',
    dateTransaction: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Vente de produits',
    'Services',
    'Autres recettes',
    'Achat de marchandises',
    'Frais de transport',
    'Loyer',
    'Électricité',
    'Eau',
    'Internet/Téléphone',
    'Salaires',
    'Assurance',
    'Maintenance',
    'Marketing',
    'Fournitures de bureau',
    'Autres dépenses',
  ];

  const loadTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'TOUS') params.append('type', typeFilter);
      if (categorieFilter) params.append('categorie', categorieFilter);
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);
      
      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || {
          recettesMois: 0,
          depensesMois: 0,
          beneficeMois: 0,
          solde: 0,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  }, [searchTerm, typeFilter, categorieFilter, dateDebut, dateFin]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await loadTransactions();
      setLoading(false);
    };

    loadData();
  }, [session, status, router, loadTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTransactions();
        resetForm();
        alert(editingTransaction ? 'Transaction mise à jour avec succès!' : 'Transaction créée avec succès!');
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
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTransactions();
        alert('Transaction supprimée avec succès!');
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
      type: 'RECETTE',
      montant: 0,
      description: '',
      categorie: '',
      dateTransaction: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const editTransaction = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      montant: Math.abs(transaction.montant),
      description: transaction.description,
      categorie: transaction.categorie,
      dateTransaction: new Date(transaction.dateTransaction).toISOString().split('T')[0],
    });
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('TOUS');
    setCategorieFilter('');
    setDateDebut('');
    setDateFin('');
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
            <DollarSign className="w-8 h-8 text-blue-600" />
            Transactions Financières
          </h1>
          <p className="text-gray-600 mt-2">Gérez vos recettes et dépenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Transaction
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Recettes du mois</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.recettesMois.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Dépenses du mois</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.depensesMois.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Bénéfice du mois</p>
              <p className={`text-2xl font-bold ${stats.beneficeMois >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.beneficeMois.toLocaleString()} FCFA
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.beneficeMois >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`w-6 h-6 ${stats.beneficeMois >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Solde total</p>
              <p className={`text-2xl font-bold ${stats.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {stats.solde.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'TOUS' | 'RECETTE' | 'DEPENSE')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TOUS">Tous les types</option>
              <option value="RECETTE">Recettes</option>
              <option value="DEPENSE">Dépenses</option>
            </select>
          </div>

          <div>
            <select
              value={categorieFilter}
              onChange={(e) => setCategorieFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date début"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date fin"
            />
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Effacer les filtres"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vente liée
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(transaction.dateTransaction).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'RECETTE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'RECETTE' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {transaction.type === 'RECETTE' ? 'Recette' : 'Dépense'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.categorie}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'RECETTE' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'RECETTE' ? '+' : '-'}
                      {Math.abs(transaction.montant).toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.vente ? (
                      <div>
                        <div className="font-medium">{transaction.vente.numeroVente}</div>
                        {transaction.vente.client && (
                          <div className="text-xs text-gray-400">
                            {transaction.vente.client.prenom} {transaction.vente.client.nom}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowDetails(transaction)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!transaction.vente && (
                        <>
                          <button
                            onClick={() => editTransaction(transaction)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune transaction</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première transaction.
            </p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTransaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'RECETTE' | 'DEPENSE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="RECETTE">Recette</option>
                  <option value="DEPENSE">Dépense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description de la transaction"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de transaction *
                </label>
                <input
                  type="date"
                  value={formData.dateTransaction}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateTransaction: e.target.value }))}
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
                  {editingTransaction ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Détails de la transaction
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    showDetails.type === 'RECETTE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {showDetails.type === 'RECETTE' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {showDetails.type === 'RECETTE' ? 'Recette' : 'Dépense'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Montant</label>
                  <p className={`text-lg font-bold ${showDetails.type === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
                    {showDetails.type === 'RECETTE' ? '+' : '-'}
                    {Math.abs(showDetails.montant).toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(showDetails.dateTransaction).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Catégorie</label>
                  <p className="text-sm text-gray-900">{showDetails.categorie}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{showDetails.description}</p>
              </div>

              {showDetails.vente && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Vente associée</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{showDetails.vente.numeroVente}</p>
                    {showDetails.vente.client && (
                      <p className="text-sm text-gray-600">
                        Client: {showDetails.vente.client.prenom} {showDetails.vente.client.nom}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500">Date de création</label>
                <p className="text-sm text-gray-900">
                  {new Date(showDetails.dateCreation).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}