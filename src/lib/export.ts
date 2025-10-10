/**
 * Bibliothèque d'export de données vers Excel et CSV
 * Utilise la librairie xlsx pour générer des fichiers Excel
 */

import * as XLSX from 'xlsx';
import { formatMontant } from './utils';

export interface ExportColumn {
  header: string;
  key: string;
  format?: 'montant' | 'date' | 'text' | 'number';
  width?: number;
}

export interface ExportOptions {
  filename: string;
  sheetName: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
}

/**
 * Formate une valeur selon le type spécifié
 */
function formatValue(value: unknown, format?: string): string | number {
  if (value === null || value === undefined) return '';

  switch (format) {
    case 'montant':
      return formatMontant(Number(value));

    case 'date':
      if (typeof value === 'string') {
        const date = new Date(value);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
      return String(value);

    case 'number':
      return Number(value);

    case 'text':
    default:
      return String(value);
  }
}

/**
 * Exporte des données vers un fichier Excel (.xlsx)
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename, sheetName, columns, data, title, subtitle } = options;

  // Créer le workbook
  const wb = XLSX.utils.book_new();

  // Préparer les données
  const rows: (string | number)[][] = [];

  // Ajouter le titre et sous-titre si fournis
  if (title) {
    rows.push([title]);
    rows.push([]); // Ligne vide
  }
  if (subtitle) {
    rows.push([subtitle]);
    rows.push([]); // Ligne vide
  }

  // Ajouter les en-têtes de colonnes
  const headers = columns.map(col => col.header);
  rows.push(headers);

  // Ajouter les données
  data.forEach(item => {
    const row = columns.map(col => {
      const value = getNestedValue(item, col.key);
      return formatValue(value, col.format);
    });
    rows.push(row);
  });

  // Créer la feuille de calcul
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Définir la largeur des colonnes
  const colWidths = columns.map(col => ({
    wch: col.width || 15
  }));
  ws['!cols'] = colWidths;

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Générer le fichier et déclencher le téléchargement
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Exporte des données vers un fichier CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle } = options;

  // Préparer les lignes CSV
  const rows: string[] = [];

  // Ajouter le titre et sous-titre si fournis
  if (title) {
    rows.push(`"${title}"`);
    rows.push(''); // Ligne vide
  }
  if (subtitle) {
    rows.push(`"${subtitle}"`);
    rows.push(''); // Ligne vide
  }

  // Ajouter les en-têtes
  const headers = columns.map(col => `"${col.header}"`).join(',');
  rows.push(headers);

  // Ajouter les données
  data.forEach(item => {
    const row = columns.map(col => {
      const value = getNestedValue(item, col.key);
      const formatted = formatValue(value, col.format);
      // Échapper les guillemets dans les valeurs
      const escaped = String(formatted).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
    rows.push(row);
  });

  // Créer le contenu CSV
  const csvContent = rows.join('\n');

  // Créer un Blob et déclencher le téléchargement
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Récupère une valeur dans un objet imbriqué à partir d'un chemin (ex: "client.nom")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Configurations prédéfinies pour les exports courants
 */
export const ExportConfigs = {
  ventes: {
    sheetName: 'Ventes',
    columns: [
      { header: 'N° Vente', key: 'numeroVente', format: 'text' as const, width: 15 },
      { header: 'Date', key: 'dateVente', format: 'date' as const, width: 12 },
      { header: 'Client', key: 'client.nom', format: 'text' as const, width: 20 },
      { header: 'Montant Total', key: 'montantTotal', format: 'montant' as const, width: 15 },
      { header: 'Montant Payé', key: 'montantPaye', format: 'montant' as const, width: 15 },
      { header: 'Montant Restant', key: 'montantRestant', format: 'montant' as const, width: 15 },
      { header: 'Statut', key: 'statut', format: 'text' as const, width: 12 },
    ],
  },

  produits: {
    sheetName: 'Produits',
    columns: [
      { header: 'Code', key: 'code', format: 'text' as const, width: 12 },
      { header: 'Nom', key: 'nom', format: 'text' as const, width: 25 },
      { header: 'Catégorie', key: 'categorie.nom', format: 'text' as const, width: 20 },
      { header: 'Prix Unitaire', key: 'prixUnitaire', format: 'montant' as const, width: 15 },
      { header: 'Stock', key: 'stocks.0.quantite', format: 'number' as const, width: 10 },
      { header: 'Seuil Alerte', key: 'seuilAlerte', format: 'number' as const, width: 12 },
    ],
  },

  clients: {
    sheetName: 'Clients',
    columns: [
      { header: 'Code', key: 'code', format: 'text' as const, width: 12 },
      { header: 'Nom', key: 'nom', format: 'text' as const, width: 25 },
      { header: 'Téléphone', key: 'telephone', format: 'text' as const, width: 15 },
      { header: 'Email', key: 'email', format: 'text' as const, width: 25 },
      { header: 'Adresse', key: 'adresse', format: 'text' as const, width: 30 },
      { header: 'Date Création', key: 'createdAt', format: 'date' as const, width: 12 },
    ],
  },

  transactions: {
    sheetName: 'Transactions',
    columns: [
      { header: 'Date', key: 'date', format: 'date' as const, width: 12 },
      { header: 'Type', key: 'type', format: 'text' as const, width: 15 },
      { header: 'Catégorie', key: 'categorie', format: 'text' as const, width: 20 },
      { header: 'Montant', key: 'montant', format: 'montant' as const, width: 15 },
      { header: 'Description', key: 'description', format: 'text' as const, width: 35 },
    ],
  },

  capital: {
    sheetName: 'Capital',
    columns: [
      { header: 'Date', key: 'date', format: 'date' as const, width: 12 },
      { header: 'Type', key: 'type', format: 'text' as const, width: 15 },
      { header: 'Montant', key: 'montant', format: 'montant' as const, width: 15 },
      { header: 'Description', key: 'description', format: 'text' as const, width: 35 },
      { header: 'Boutique', key: 'boutique.nom', format: 'text' as const, width: 20 },
    ],
  },

  rapports: {
    sheetName: 'Rapport',
    columns: [
      { header: 'Boutique', key: 'nom', format: 'text' as const, width: 25 },
      { header: 'Capital Initial', key: 'capitalInitial', format: 'montant' as const, width: 18 },
      { header: 'Capital Actuel', key: 'capitalActuel', format: 'montant' as const, width: 18 },
      { header: 'CA Total', key: 'stats.chiffreAffaires', format: 'montant' as const, width: 18 },
      { header: 'Bénéfices', key: 'stats.benefices', format: 'montant' as const, width: 18 },
      { header: 'Total Dépenses', key: 'stats.totalDepenses', format: 'montant' as const, width: 18 },
      { header: 'Total Produits', key: 'stats.totalProduits', format: 'number' as const, width: 15 },
      { header: 'Total Ventes', key: 'stats.totalVentes', format: 'number' as const, width: 15 },
    ],
  },
};

/**
 * Fonctions helper rapides pour les exports courants
 */
export function exportVentesToExcel(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToExcel({
    filename: 'ventes',
    ...ExportConfigs.ventes,
    data,
    title: 'Liste des Ventes',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportVentesToCSV(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToCSV({
    filename: 'ventes',
    ...ExportConfigs.ventes,
    data,
    title: 'Liste des Ventes',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportProduitsToExcel(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToExcel({
    filename: 'produits',
    ...ExportConfigs.produits,
    data,
    title: 'Liste des Produits',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportProduitsToCSV(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToCSV({
    filename: 'produits',
    ...ExportConfigs.produits,
    data,
    title: 'Liste des Produits',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportClientsToExcel(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToExcel({
    filename: 'clients',
    ...ExportConfigs.clients,
    data,
    title: 'Liste des Clients',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportClientsToCSV(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToCSV({
    filename: 'clients',
    ...ExportConfigs.clients,
    data,
    title: 'Liste des Clients',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportTransactionsToExcel(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToExcel({
    filename: 'transactions',
    ...ExportConfigs.transactions,
    data,
    title: 'Liste des Transactions',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportTransactionsToCSV(data: Record<string, unknown>[], boutiqueName?: string) {
  exportToCSV({
    filename: 'transactions',
    ...ExportConfigs.transactions,
    data,
    title: 'Liste des Transactions',
    subtitle: boutiqueName ? `Boutique: ${boutiqueName}` : undefined,
  });
}

export function exportCapitalToExcel(data: Record<string, unknown>[]) {
  exportToExcel({
    filename: 'capital',
    ...ExportConfigs.capital,
    data,
    title: 'Historique du Capital',
  });
}

export function exportCapitalToCSV(data: Record<string, unknown>[]) {
  exportToCSV({
    filename: 'capital',
    ...ExportConfigs.capital,
    data,
    title: 'Historique du Capital',
  });
}

export function exportRapportsToExcel(data: Record<string, unknown>[]) {
  exportToExcel({
    filename: 'rapport_global',
    ...ExportConfigs.rapports,
    data,
    title: 'Rapport Consolidé',
    subtitle: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
  });
}

export function exportRapportsToCSV(data: Record<string, unknown>[]) {
  exportToCSV({
    filename: 'rapport_global',
    ...ExportConfigs.rapports,
    data,
    title: 'Rapport Consolidé',
    subtitle: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
  });
}
