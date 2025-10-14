'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LazyLineChart as LineChart,
  LazyLine as Line,
  LazyBarChart as BarChart,
  LazyBar as Bar,
  LazyResponsiveContainer as ResponsiveContainer,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyCartesianGrid as CartesianGrid,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
  LazyChartWrapper
} from '@/components/charts/LazyCharts';
import { Store, ShoppingCart, TrendingUp, AlertCircle, DollarSign, Users } from 'lucide-react';
import { formatMontant, formatMontantCompact } from '@/lib/utils';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ProductList } from '@/components/ui/ProductList';
import { AlertsList } from '@/components/ui/AlertsList';
import { QuickActions } from '@/components/ui/QuickActions';
import { Button } from '@/components/ui/Button';

interface DashboardStats {
  boutiques: number;
  produits: number;
  clients: number;
  ventes: number;
  chiffreAffaires: number;
  impays: number;
  stocksFaibles: number;
  tendance: {
    ventes: number;
    ca: number;
  };
}

interface VentesData {
  date: string;
  montant: number;
  nombre: number;
}

interface BoutiquePerformance {
  nom: string;
  ventes: number;
  ca: number;
}

interface TopProduit {
  nom: string;
  quantite: number;
  ca: number;
}

interface AlerteStock {
  produit: string;
  boutique: string;
  quantite: number;
  seuil: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    boutiques: 0,
    produits: 0,
    clients: 0,
    ventes: 0,
    chiffreAffaires: 0,
    impays: 0,
    stocksFaibles: 0,
    tendance: { ventes: 0, ca: 0 },
  });
  const [ventesData, setVentesData] = useState<VentesData[]>([]);
  const [boutiquesPerf, setBoutiquesPerf] = useState<BoutiquePerformance[]>([]);
  const [topProduits, setTopProduits] = useState<TopProduit[]>([]);
  const [alertes, setAlertes] = useState<AlerteStock[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Charger les stats générales
      const [boutiquesRes, ventesRes, stocksRes] = await Promise.all([
        fetch('/api/boutiques?includeStats=true'),
        fetch('/api/ventes'),
        fetch('/api/stocks'),
      ]);

      if (boutiquesRes.ok && ventesRes.ok) {
        const boutiques = await boutiquesRes.json();
        const ventes = await ventesRes.json();
        const stocks = stocksRes.ok ? await stocksRes.json() : [];

        // Calculer stats
        const totalVentes = ventes.length;
        const totalCA = ventes.reduce((sum: number, v: { montantTotal: number }) => sum + v.montantTotal, 0);
        const totalImpays = ventes
          .filter((v: { statut: string }) => v.statut === 'IMPAYE' || v.statut === 'PARTIEL')
          .reduce((sum: number, v: { montantRestant: number }) => sum + (v.montantRestant || 0), 0);

        // Alertes stock
        const stocksFaibles = stocks.filter((s: {quantite: number; produit: {seuilAlerte: number}}) =>
          s.quantite <= s.produit.seuilAlerte
        );

        setStats({
          boutiques: boutiques.length,
          produits: stocks.length,
          clients: 0, // À calculer si API clients
          ventes: totalVentes,
          chiffreAffaires: totalCA,
          impays: totalImpays,
          stocksFaibles: stocksFaibles.length,
          tendance: {
            ventes: 12.5, // À calculer avec données historiques
            ca: 8.3,
          },
        });

        // Ventes des 7 derniers jours
        const last7Days = getlast7Days();
        const ventesParJour = last7Days.map(date => {
          const dayVentes = ventes.filter((v: {dateVente: string}) =>
            new Date(v.dateVente).toDateString() === date.toDateString()
          );
          return {
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            montant: dayVentes.reduce((sum: number, v: {montantTotal: number}) => sum + v.montantTotal, 0),
            nombre: dayVentes.length,
          };
        });
        setVentesData(ventesParJour);

        // Performance par boutique
        const boutiquesPerfData = boutiques.slice(0, 5).map((b: {nom: string; stats?: {totalVentes: number; nombreVentes: number}}) => ({
          nom: b.nom,
          ventes: b.stats?.nombreVentes || 0,
          ca: b.stats?.totalVentes || 0,
        }));
        setBoutiquesPerf(boutiquesPerfData);

        // Top 5 produits (simulé pour l'instant)
        setTopProduits([
          { nom: 'Produit A', quantite: 45, ca: 450000 },
          { nom: 'Produit B', quantite: 38, ca: 380000 },
          { nom: 'Produit C', quantite: 32, ca: 320000 },
          { nom: 'Produit D', quantite: 28, ca: 280000 },
          { nom: 'Produit E', quantite: 25, ca: 250000 },
        ]);

        // Alertes stock
        const alertesData = stocksFaibles.slice(0, 5).map((s: {
          produit: {nom: string; seuilAlerte: number};
          boutique: {nom: string};
          quantite: number;
        }) => ({
          produit: s.produit.nom,
          boutique: s.boutique.nom,
          quantite: s.quantite,
          seuil: s.produit.seuilAlerte,
        }));
        setAlertes(alertesData);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
    if (session?.user?.role !== 'ADMIN') {
      redirect('/boutique');
    }
    loadDashboardData();
  }, [session, status, loadDashboardData]);

  const getlast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  const statCards = [
    {
      title: 'Chiffre d&apos;Affaires',
      value: formatMontantCompact(stats.chiffreAffaires),
      fullValue: formatMontant(stats.chiffreAffaires),
      icon: DollarSign,
      color: 'bg-green-500',
      trend: stats.tendance.ca,
      trendUp: stats.tendance.ca > 0,
    },
    {
      title: 'Ventes',
      value: stats.ventes,
      fullValue: `${stats.ventes} ventes`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: stats.tendance.ventes,
      trendUp: stats.tendance.ventes > 0,
    },
    {
      title: 'Boutiques',
      value: stats.boutiques,
      fullValue: `${stats.boutiques} boutiques`,
      icon: Store,
      color: 'bg-purple-500',
      trend: 0,
      trendUp: true,
    },
    {
      title: 'Impayés',
      value: formatMontantCompact(stats.impays),
      fullValue: formatMontant(stats.impays),
      icon: AlertCircle,
      color: 'bg-red-500',
      trend: 0,
      trendUp: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Tableau de Bord Administrateur"
        description="Vue d'ensemble de toutes les boutiques"
        actions={
          <Link 
            href="/dashboard/boutiques"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm h-9 px-3 text-sm"
          >
            Gérer les boutiques
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            fullValue={card.fullValue}
            icon={card.icon}
            iconColor={card.color.replace('bg-', '').replace('-500', '') as any}
            trend={card.trend}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des Ventes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des Ventes (7 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatMontant(value)}
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="montant" stroke="#3B82F6" strokeWidth={2} name="Montant (FCFA)" />
              <Line type="monotone" dataKey="nombre" stroke="#10B981" strokeWidth={2} name="Nombre de ventes" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance par Boutique */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance par Boutique
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={boutiquesPerf}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'ca' ? formatMontant(value) : value
                }
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="ventes" fill="#3B82F6" name="Nombre de ventes" />
              <Bar dataKey="ca" fill="#10B981" name="CA (FCFA)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produits */}
        <ProductList
          title="Top 5 Produits"
          products={topProduits}
          viewAllHref="/dashboard/rapports"
          formatAmount={formatMontantCompact}
        />

        {/* Alertes Stock */}
        <AlertsList
          title="Alertes Stock Faible"
          alerts={alertes}
          alertCount={stats.stocksFaibles}
          viewAllHref="/dashboard/rapports?type=stocks"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        title="Actions Rapides"
        actions={[
          { href: '/dashboard/boutiques', icon: Store, label: 'Boutiques' },
          { href: '/dashboard/utilisateurs', icon: Users, label: 'Utilisateurs' },
          { href: '/dashboard/capital', icon: DollarSign, label: 'Capital', highlighted: true },
          { href: '/dashboard/rapports', icon: TrendingUp, label: 'Rapports' },
        ]}
      />
    </div>
  );
}
