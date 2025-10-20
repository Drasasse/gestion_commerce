'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatMontant } from '@/lib/utils';
import ExportButton from '@/components/ExportButton';
import { exportRapportsToExcel, exportRapportsToCSV } from '@/lib/export';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import MobileStatsCard from '@/components/MobileStatsCard';
import ResponsiveTable, { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/ResponsiveTable';
import { DollarSign, TrendingUp, AlertTriangle, Package } from 'lucide-react';

interface BoutiqueStats {
  id: string;
  nom: string;
  totalVentes: number;
  nombreVentes: number;
  totalImpayes: number;
  totalProduits: number;
  totalClients: number;
  capitalActuel: number;
}

export default function RapportsAdminPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [boutiquesStats, setBoutiquesStats] = useState<BoutiqueStats[]>([]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateDebut(firstDay.toISOString().split('T')[0]);
    setDateFin(today.toISOString().split('T')[0]);

    loadData();
  }, []);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  const loadData = async () => {
    try {
      const [boutiquesRes, injectionsRes] = await Promise.all([
        fetch('/api/boutiques?includeStats=true'),
        fetch('/api/capital')
      ]);

      if (boutiquesRes.ok) {
        const boutiquesData = await boutiquesRes.json();
        const injections = injectionsRes.ok ? await injectionsRes.json() : [];

        // Process stats for each boutique
        const stats: BoutiqueStats[] = await Promise.all(
          boutiquesData.map(async (boutique: { id: string; nom: string; capitalInitial?: number; stats?: { totalVentes: number; nombreVentes: number; totalImpayes: number; nombreProduits: number; nombreClients: number } }) => {
            // Calculate total injections for this boutique
            const boutiqueInjections = injections.filter(
              (inj: { boutique: { id: string }; montant: number }) => inj.boutique.id === boutique.id
            );
            const totalInjections = boutiqueInjections.reduce(
              (sum: number, inj: { montant: number }) => sum + inj.montant,
              0
            );

            return {
              id: boutique.id,
              nom: boutique.nom,
              totalVentes: boutique.stats?.totalVentes || 0,
              nombreVentes: boutique.stats?.nombreVentes || 0,
              totalImpayes: boutique.stats?.totalImpayes || 0,
              totalProduits: boutique.stats?.nombreProduits || 0,
              totalClients: boutique.stats?.nombreClients || 0,
              capitalActuel: (boutique.capitalInitial || 0) + totalInjections,
            };
          })
        );

        setBoutiquesStats(stats);
      }
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton
          type="stat"
          count={4}
        />
        <LoadingSkeleton
          type="table"
        />
      </div>
    );
  }

  const totaux = boutiquesStats.reduce(
    (acc, boutique) => ({
      totalVentes: acc.totalVentes + boutique.totalVentes,
      nombreVentes: acc.nombreVentes + boutique.nombreVentes,
      totalImpayes: acc.totalImpayes + boutique.totalImpayes,
      totalProduits: acc.totalProduits + boutique.totalProduits,
      totalClients: acc.totalClients + boutique.totalClients,
      capitalTotal: acc.capitalTotal + boutique.capitalActuel,
    }),
    { totalVentes: 0, nombreVentes: 0, totalImpayes: 0, totalProduits: 0, totalClients: 0, capitalTotal: 0 }
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Consolidés</h1>
          <p className="text-gray-600 mt-1">Vue d&apos;ensemble de toutes les boutiques</p>
        </div>
        <ExportButton
          onExportExcel={() => exportRapportsToExcel(boutiquesStats as unknown as Record<string, unknown>[])}
          onExportCSV={() => exportRapportsToCSV(boutiquesStats as unknown as Record<string, unknown>[])}
          disabled={boutiquesStats.length === 0}
        />
      </div>

      {/* Filtres de date */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Vue d'ensemble globale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MobileStatsCard
          title="Total Ventes"
          value={formatMontant(totaux.totalVentes)}
          icon={DollarSign}
          color="blue"
          trend={{
            value: totaux.nombreVentes,
            label: "vente(s)",
            isPositive: true
          }}
        />

        <MobileStatsCard
          title="Capital Total"
          value={formatMontant(totaux.capitalTotal)}
          icon={TrendingUp}
          color="green"
          trend={{
            value: boutiquesStats.length,
            label: "boutique(s)",
            isPositive: true
          }}
        />

        <MobileStatsCard
          title="Total Impayés"
          value={formatMontant(totaux.totalImpayes)}
          icon={AlertTriangle}
          color="red"
        />

        <MobileStatsCard
          title="Total Produits"
          value={totaux.totalProduits.toString()}
          icon={Package}
          color="purple"
          trend={{
            value: totaux.totalClients,
            label: "client(s)",
            isPositive: true
          }}
        />
      </div>

      {/* Performance par boutique */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance par Boutique</h2>
        </div>
        <ResponsiveTable>
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Boutique</TableHeader>
                <TableHeader>Ventes</TableHeader>
                <TableHeader>Nb Ventes</TableHeader>
                <TableHeader>Impayés</TableHeader>
                <TableHeader>Produits</TableHeader>
                <TableHeader>Clients</TableHeader>
                <TableHeader>Capital</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {boutiquesStats.map((boutique) => (
                <TableRow key={boutique.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{boutique.nom}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-green-600">
                      {formatMontant(boutique.totalVentes)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 dark:text-gray-300">{boutique.nombreVentes}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-red-600">
                      {formatMontant(boutique.totalImpayes)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 dark:text-gray-300">{boutique.totalProduits}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 dark:text-gray-300">{boutique.totalClients}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-blue-600">
                      {formatMontant(boutique.capitalActuel)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {boutiquesStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Section d'analyse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performances</h3>
          <div className="space-y-3">
            {boutiquesStats
              .sort((a, b) => b.totalVentes - a.totalVentes)
              .slice(0, 3)
              .map((boutique, index) => (
                <div key={boutique.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{boutique.nom}</span>
                  </div>
                  <span className="font-semibold text-green-600">{formatMontant(boutique.totalVentes)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impayés par Boutique</h3>
          <div className="space-y-3">
            {boutiquesStats
              .filter(b => b.totalImpayes > 0)
              .sort((a, b) => b.totalImpayes - a.totalImpayes)
              .map((boutique) => (
                <div key={boutique.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-gray-900">{boutique.nom}</span>
                  <span className="font-semibold text-red-600">{formatMontant(boutique.totalImpayes)}</span>
                </div>
              ))}
            {boutiquesStats.filter(b => b.totalImpayes > 0).length === 0 && (
              <p className="text-center text-gray-500 py-4">Aucun impayé</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
