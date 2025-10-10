'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { formatMontant, formatMontantCompact, formatDate } from '@/lib/utils';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';

interface BoutiqueStats {
  produits: number;
  ventes: number;
  clients: number;
  ca: number;
  impayes: number;
  stocksFaibles: number;
  categoriesCount: number;
  ventesAujourdHui: number;
  caAujourdHui: number;
  tendance: {
    ventes: number;
    ca: number;
  };
}

interface VenteRecente {
  id: string;
  numeroVente: string;
  montantTotal: number;
  statut: string;
  dateVente: string;
  client?: { nom: string };
}

interface VentesData {
  date: string;
  montant: number;
  nombre: number;
}

interface StatutVentesData {
  name: string;
  value: number;
  montant: number;
  [key: string]: string | number;
}

interface AlerteStock {
  id: string;
  quantite: number;
  produit: {
    nom: string;
    seuilAlerte: number;
  };
}

const COLORS = {
  PAYE: '#10B981',
  IMPAYE: '#EF4444',
  PARTIEL: '#F59E0B',
};

export default function BoutiquePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BoutiqueStats>({
    produits: 0,
    ventes: 0,
    clients: 0,
    ca: 0,
    impayes: 0,
    stocksFaibles: 0,
    categoriesCount: 0,
    ventesAujourdHui: 0,
    caAujourdHui: 0,
    tendance: { ventes: 0, ca: 0 },
  });
  const [ventesRecentes, setVentesRecentes] = useState<VenteRecente[]>([]);
  const [ventesData, setVentesData] = useState<VentesData[]>([]);
  const [statutsData, setStatutsData] = useState<StatutVentesData[]>([]);

  const [alertesStock, setAlertesStock] = useState<AlerteStock[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const boutiqueId = session?.user?.boutiqueId;
      if (!boutiqueId) return;

      const [produitsRes, ventesRes, clientsRes, categoriesRes, stocksRes] = await Promise.all([
        fetch(`/api/produits?boutiqueId=${boutiqueId}`),
        fetch(`/api/ventes?boutiqueId=${boutiqueId}`),
        fetch(`/api/clients?boutiqueId=${boutiqueId}`),
        fetch(`/api/categories?boutiqueId=${boutiqueId}`),
        fetch(`/api/stocks?boutiqueId=${boutiqueId}`),
      ]);

      if (produitsRes.ok && ventesRes.ok) {
        const produitsData = await produitsRes.json();
        const produits = Array.isArray(produitsData?.produits) ? produitsData.produits : (Array.isArray(produitsData) ? produitsData : []);

        const ventesResponse = await ventesRes.json();
        const ventesRaw = ventesResponse?.ventes || ventesResponse;
        const ventes = Array.isArray(ventesRaw) ? ventesRaw : [];

        const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const clients = Array.isArray(clientsData?.clients) ? clientsData.clients : (Array.isArray(clientsData) ? clientsData : []);

        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };
        const categories = Array.isArray(categoriesData?.categories) ? categoriesData.categories : (Array.isArray(categoriesData) ? categoriesData : []);

        const stocksData = stocksRes.ok ? await stocksRes.json() : { stocks: [] };
        const stocks = Array.isArray(stocksData?.stocks) ? stocksData.stocks : (Array.isArray(stocksData) ? stocksData : []);

        // Calculer stats
        const totalCA = ventes.reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);
        const totalImpayes = ventes
          .filter((v: { statut: string }) => v.statut !== 'PAYE')
          .reduce((sum: number, v: { montantRestant?: number }) => sum + (v.montantRestant || 0), 0);

        // Ventes d'aujourd'hui
        const today = new Date().toDateString();
        const ventesToday = ventes.filter((v: { dateVente: string }) =>
          new Date(v.dateVente).toDateString() === today
        );
        const ventesAujourdHui = ventesToday.length;
        const caAujourdHui = ventesToday.reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);

        // Stocks faibles
        const stocksFaibles = stocks.filter((s: { quantite: number; produit: { seuilAlerte: number } }) =>
          s.quantite <= s.produit.seuilAlerte
        );

        setStats({
          produits: produits.length,
          ventes: ventes.length,
          clients: clients.length,
          ca: totalCA,
          impayes: totalImpayes,
          stocksFaibles: stocksFaibles.length,
          categoriesCount: categories.length,
          ventesAujourdHui,
          caAujourdHui,
          tendance: {
            ventes: 8.5,
            ca: 12.3,
          },
        });

        // 5 Ventes récentes
        setVentesRecentes(ventes.slice(0, 5));

        // Ventes des 7 derniers jours
        const last7Days = getLast7Days();
        const ventesParJour = last7Days.map(date => {
          const dayVentes = ventes.filter((v: { dateVente: string }) =>
            new Date(v.dateVente).toDateString() === date.toDateString()
          );
          return {
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            montant: dayVentes.reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0),
            nombre: dayVentes.length,
          };
        });
        setVentesData(ventesParJour);

        // Statuts des ventes
        const payes = ventes.filter((v: { statut: string }) => v.statut === 'PAYE').length;
        const impayes = ventes.filter((v: { statut: string }) => v.statut === 'IMPAYE').length;
        const partiels = ventes.filter((v: { statut: string }) => v.statut === 'PARTIEL').length;

        const payesMontant = ventes
          .filter((v: { statut: string }) => v.statut === 'PAYE')
          .reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);
        const impayesMontant = ventes
          .filter((v: { statut: string }) => v.statut === 'IMPAYE')
          .reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);
        const partielsMontant = ventes
          .filter((v: { statut: string }) => v.statut === 'PARTIEL')
          .reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);

        setStatutsData([
          { name: 'Payées', value: payes, montant: payesMontant },
          { name: 'Impayées', value: impayes, montant: impayesMontant },
          { name: 'Partielles', value: partiels, montant: partielsMontant },
        ]);



        // Alertes stock
        setAlertesStock(stocksFaibles.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
    if (!session?.user?.boutiqueId) {
      return;
    }
    loadDashboardData();
  }, [session, status, loadDashboardData]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  if (!session?.user?.boutiqueId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Aucune boutique assignée
          </h1>
          <p className="text-gray-600">
            Contactez l&apos;administrateur pour vous assigner une boutique.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  const statCards = [
    {
      title: 'Chiffre d\'Affaires',
      value: formatMontantCompact(stats.ca),
      subtitle: `Aujourd'hui: ${formatMontantCompact(stats.caAujourdHui)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: stats.tendance.ca,
      trendUp: true,
    },
    {
      title: 'Ventes',
      value: stats.ventes,
      subtitle: `Aujourd'hui: ${stats.ventesAujourdHui}`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: stats.tendance.ventes,
      trendUp: true,
    },
    {
      title: 'Produits',
      value: stats.produits,
      subtitle: `${stats.categoriesCount} catégories`,
      icon: Package,
      color: 'bg-purple-500',
      trend: 0,
      trendUp: true,
    },
    {
      title: 'Impayés',
      value: formatMontantCompact(stats.impayes),
      subtitle: `${stats.clients} clients`,
      icon: CreditCard,
      color: stats.impayes > 100000 ? 'bg-red-500' : 'bg-orange-500',
      trend: 0,
      trendUp: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {session?.user?.boutique?.nom}
        </h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Tableau de bord • {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                {card.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendIcon size={16} />
                    <span>{card.trend}%</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution Ventes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des Ventes (7 jours)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'montant' ? formatMontant(value) : value
                }
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="montant" stroke="#3B82F6" strokeWidth={2} name="Montant (FCFA)" />
              <Line type="monotone" dataKey="nombre" stroke="#10B981" strokeWidth={2} name="Nombre" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Statuts Ventes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par Statut
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statutsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: { payload?: StatutVentesData }) => [
                    `${value} ventes (${formatMontant(props.payload?.montant || 0)})`,
                    name,
                  ]}
                  contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventes Récentes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ventes Récentes</h3>
            <Link href="/boutique/ventes" className="text-sm text-blue-600 hover:text-blue-800">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {ventesRecentes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune vente</p>
            ) : (
              ventesRecentes.map((vente) => (
                <div key={vente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{vente.numeroVente}</p>
                    <p className="text-sm text-gray-600">
                      {vente.client?.nom || 'Client anonyme'} • {formatDate(vente.dateVente)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatMontant(vente.montantTotal)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        vente.statut === 'PAYE'
                          ? 'bg-green-100 text-green-800'
                          : vente.statut === 'IMPAYE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {vente.statut}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertes Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            <span>Alertes Stock ({stats.stocksFaibles})</span>
          </h3>
          <div className="space-y-3">
            {alertesStock.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Package className="text-green-600" size={24} />
                </div>
                <p className="text-sm text-gray-600">Tous les stocks sont OK</p>
              </div>
            ) : (
              alertesStock.map((stock: AlerteStock) => (
                <div key={stock.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="font-medium text-gray-900 text-sm">{stock.produit.nom}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Stock: {stock.quantite} / Seuil: {stock.produit.seuilAlerte}
                  </p>
                </div>
              ))
            )}
          </div>
          {alertesStock.length > 0 && (
            <Link
              href="/boutique/stocks"
              className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Gérer les stocks →
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/boutique/ventes"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <ShoppingCart className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Nouvelle Vente</p>
          </Link>
          <Link
            href="/boutique/produits"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <Package className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Produits</p>
          </Link>
          <Link
            href="/boutique/clients"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <Users className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Clients</p>
          </Link>
          <Link
            href="/boutique/rapports"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <TrendingUp className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Rapports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
