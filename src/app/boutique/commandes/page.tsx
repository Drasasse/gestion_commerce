'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { Plus, Package, Building2, Calendar, DollarSign, Filter } from 'lucide-react';
import { formatMontant, formatDate } from '@/lib/utils';

interface Commande {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RECUE' | 'ANNULEE';
  dateCommande: string;
  dateReception?: string;
  fournisseur: {
    nom: string;
    prenom?: string;
    entreprise?: string;
  };
  _count: {
    lignes: number;
  };
}

const STATUTS = [
  { value: 'EN_ATTENTE', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  { value: 'RECUE', label: 'Reçue', color: 'bg-green-100 text-green-800' },
  { value: 'ANNULEE', label: 'Annulée', color: 'bg-red-100 text-red-800' },
];

export default function CommandesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    loadCommandes();
  }, [filterStatut]);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session) redirect('/login');

  const loadCommandes = async () => {
    try {
      const url = filterStatut
        ? `/api/commandes?statut=${filterStatut}`
        : '/api/commandes';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCommandes(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutInfo = (statut: string) => {
    return STATUTS.find((s) => s.value === statut) || STATUTS[0];
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      const response = await fetch(`/api/commandes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadCommandes();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Gestion des Commandes
          </h1>
          <p className="text-gray-600 mt-2">Passez et suivez vos commandes fournisseurs</p>
        </div>
        <button
          onClick={() => router.push('/boutique/commandes/nouvelle')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Commande
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {STATUTS.map((statut) => (
              <option key={statut.value} value={statut.value}>
                {statut.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {commandes.length} commande{commandes.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commandes.map((commande) => {
                const statutInfo = getStatutInfo(commande.statut);
                return (
                  <tr key={commande.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {commande.numeroCommande}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {commande.fournisseur.nom} {commande.fournisseur.prenom}
                        </div>
                        {commande.fournisseur.entreprise && (
                          <div className="text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {commande.fournisseur.entreprise}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(commande.dateCommande)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatMontant(commande.montantTotal)}
                        </div>
                        {commande.montantRestant > 0 && (
                          <div className="text-xs text-red-600">
                            Reste: {formatMontant(commande.montantRestant)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutInfo.color}`}>
                        {statutInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => router.push(`/boutique/commandes/${commande.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Détails
                      </button>
                      {commande.statut !== 'RECUE' && (
                        <button
                          onClick={() => handleDelete(commande.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {commandes.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune commande trouvée</p>
            <button
              onClick={() => router.push('/boutique/commandes/nouvelle')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Créer votre première commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
