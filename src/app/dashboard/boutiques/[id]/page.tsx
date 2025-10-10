'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMontant } from '@/lib/utils';
import { ArrowLeft, Package, Tags, Users, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

interface Boutique {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  capitalInitial: number;
}

interface Stats {
  produits: number;
  categories: number;
  clients: number;
  ventes: number;
  stocks: number;
  totalVentes: number;
}

export default function BoutiqueDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const boutiqueId = params.id as string;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [stats, setStats] = useState<Stats>({
    produits: 0,
    categories: 0,
    clients: 0,
    ventes: 0,
    stocks: 0,
    totalVentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'produits' | 'categories' | 'clients' | 'ventes'>('produits');
  const [tabData, setTabData] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadBoutiqueData();
  }, [session]);

  useEffect(() => {
    if (boutique) {
      loadTabData();
    }
  }, [activeTab, boutique]);

  const loadBoutiqueData = async () => {
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}`);
      if (res.ok) {
        const data = await res.json();
        setBoutique(data);

        // Load stats
        const [produitsRes, categoriesRes, clientsRes, ventesRes, stocksRes] = await Promise.all([
          fetch(`/api/produits?boutiqueId=${boutiqueId}`),
          fetch(`/api/categories?boutiqueId=${boutiqueId}`),
          fetch(`/api/clients?boutiqueId=${boutiqueId}`),
          fetch(`/api/ventes?boutiqueId=${boutiqueId}`),
          fetch(`/api/stocks?boutiqueId=${boutiqueId}`),
        ]);

        const produits = produitsRes.ok ? await produitsRes.json() : [];
        const categories = categoriesRes.ok ? await categoriesRes.json() : [];
        const clients = clientsRes.ok ? await clientsRes.json() : [];
        const ventes = ventesRes.ok ? await ventesRes.json() : [];
        const stocks = stocksRes.ok ? await stocksRes.json() : [];

        setStats({
          produits: produits.length,
          categories: categories.length,
          clients: clients.length,
          ventes: ventes.length,
          stocks: stocks.length,
          totalVentes: ventes.reduce((sum: number, v: any) => sum + (v.montantTotal || 0), 0),
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'produits':
          endpoint = `/api/produits?boutiqueId=${boutiqueId}`;
          break;
        case 'categories':
          endpoint = `/api/categories?boutiqueId=${boutiqueId}`;
          break;
        case 'clients':
          endpoint = `/api/clients?boutiqueId=${boutiqueId}`;
          break;
        case 'ventes':
          endpoint = `/api/ventes?boutiqueId=${boutiqueId}`;
          break;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTabData(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!boutique) {
    return <div className="p-6">Boutique non trouvée</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/boutiques"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux boutiques
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{boutique.nom}</h1>
        <div className="mt-2 space-y-1 text-gray-600">
          <p>{boutique.adresse}</p>
          <p>{boutique.telephone}</p>
          <p className="font-medium">Capital initial: {formatMontant(boutique.capitalInitial)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produits</p>
              <p className="text-2xl font-bold">{stats.produits}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Catégories</p>
              <p className="text-2xl font-bold">{stats.categories}</p>
            </div>
            <Tags className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Clients</p>
              <p className="text-2xl font-bold">{stats.clients}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ventes</p>
              <p className="text-2xl font-bold">{stats.ventes}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Ventes</p>
              <p className="text-2xl font-bold">{formatMontant(stats.totalVentes)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Stocks</p>
              <p className="text-2xl font-bold">{stats.stocks}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['produits', 'categories', 'clients', 'ventes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'produits' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix Vente</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tabData.map((produit: any) => (
                    <tr key={produit.id}>
                      <td className="px-4 py-3">{produit.nom}</td>
                      <td className="px-4 py-3">{produit.categorie?.nom || 'N/A'}</td>
                      <td className="px-4 py-3 text-right">{formatMontant(produit.prixVente)}</td>
                      <td className="px-4 py-3 text-right">{produit.stock?.quantite || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tabData.map((categorie: any) => (
                    <tr key={categorie.id}>
                      <td className="px-4 py-3">{categorie.nom}</td>
                      <td className="px-4 py-3">{categorie.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tabData.map((client: any) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3">{client.nom}</td>
                      <td className="px-4 py-3">{client.prenom || '-'}</td>
                      <td className="px-4 py-3">{client.telephone || '-'}</td>
                      <td className="px-4 py-3">{client.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ventes' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tabData.map((vente: any) => (
                    <tr key={vente.id}>
                      <td className="px-4 py-3">{vente.numeroVente}</td>
                      <td className="px-4 py-3">{vente.client?.nom || 'Client anonyme'}</td>
                      <td className="px-4 py-3">{new Date(vente.dateVente).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">{formatMontant(vente.montantTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            vente.statut === 'PAYE'
                              ? 'bg-green-100 text-green-800'
                              : vente.statut === 'IMPAYE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {vente.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tabData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
