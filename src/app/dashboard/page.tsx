'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Store, ShoppingCart, TrendingUp, AlertCircle, DollarSign, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatMontant, formatMontantCompact } from '@/lib/utils';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de Bord Administrateur
        </h1>
        <p className="text-gray-600 mt-1">
          Vue d&apos;ensemble de toutes les boutiques
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
                    <span>{Math.abs(card.trend)}%</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900" title={card.fullValue}>
                {card.value}
              </p>
            </div>
          );
        })}
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
              <Bar dataKey="ventes" fill="#8B5CF6" name="Ventes" />
              <Bar dataKey="ca" fill="#3B82F6" name="CA (FCFA)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produits */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Top 5 Produits</span>
            <Link href="/dashboard/rapports" className="text-sm text-blue-600 hover:text-blue-800">
              Voir tout
            </Link>
          </h3>
          <div className="space-y-3">
            {topProduits.map((produit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{produit.nom}</p>
                    <p className="text-sm text-gray-600">{produit.quantite} vendus</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatMontantCompact(produit.ca)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            <span>Alertes Stock Faible ({stats.stocksFaibles})</span>
          </h3>
          <div className="space-y-3">
            {alertes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune alerte de stock</p>
            ) : (
              alertes.map((alerte, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{alerte.produit}</p>
                    <p className="text-sm text-gray-600">{alerte.boutique}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600 font-semibold">{alerte.quantite} / {alerte.seuil}</p>
                    <p className="text-xs text-gray-500">Stock actuel / Seuil</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {alertes.length > 0 && (
            <Link
              href="/dashboard/rapports?type=stocks"
              className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tous les stocks →
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/boutiques"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <Store className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Boutiques</p>
          </Link>
          <Link
            href="/dashboard/utilisateurs"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <Users className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Utilisateurs</p>
          </Link>
          <Link
            href="/dashboard/capital"
            className="bg-white bg-opacity-30 hover:bg-opacity-30 rounded-lg p-4 transition-all text-center"
          >
            <DollarSign className="mx-auto mb-2" size={24} />
            <p className="text-sm font-medium">Capital</p>
          </Link>
          <Link
            href="/dashboard/rapports"
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
