/**
 * Composant Breadcrumbs accessible pour la navigation
 * Conforme aux standards WCAG pour l'accessibilité
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  className?: string;
  maxItems?: number;
}

// Configuration des routes pour génération automatique
const routeLabels: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/boutique': 'Boutique',
  '/boutique/clients': 'Clients',
  '/boutique/produits': 'Produits',
  '/boutique/ventes': 'Ventes',
  '/boutique/stocks': 'Stocks',
  '/boutique/rapports': 'Rapports',
  '/boutique/parametres': 'Paramètres',
  '/admin': 'Administration',
  '/admin/boutiques': 'Gestion des boutiques',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/logs': 'Journaux d\'audit',
  '/profil': 'Profil',
  '/parametres': 'Paramètres',
};

// Génération automatique des breadcrumbs basée sur l'URL
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Chercher le label dans la configuration
    let label = routeLabels[currentPath];
    
    // Si pas trouvé, utiliser le segment avec première lettre majuscule
    if (!label) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Remplacer les tirets par des espaces
      label = label.replace(/-/g, ' ');
      
      // Gérer les IDs (segments numériques ou UUID)
      if (/^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        // Pour les IDs, utiliser le label du parent + "Détails"
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const parentLabel = routeLabels[parentPath];
        if (parentLabel) {
          label = `${parentLabel} - Détails`;
        } else {
          label = 'Détails';
        }
      }
    }

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });

  return breadcrumbs;
}

export default function Breadcrumbs({
  items,
  separator,
  showHome = true,
  className = '',
  maxItems = 5,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Créer le séparateur par défaut
  const defaultSeparator = (
    <ChevronRight className="w-4 h-4 text-gray-400" />
  );
  
  // Utiliser les items fournis ou générer automatiquement
  const breadcrumbItems = items || generateBreadcrumbs(pathname);
  
  // Ajouter l'accueil si demandé et pas déjà présent
  const finalItems = showHome && pathname !== '/' && pathname !== '/dashboard'
    ? [
        {
          label: 'Accueil',
          href: '/dashboard',
          icon: <Home className="w-4 h-4 text-gray-400" />,
        },
        ...breadcrumbItems,
      ]
    : breadcrumbItems;

  // Limiter le nombre d'items si nécessaire
  const displayItems = finalItems.length > maxItems
    ? [
        finalItems[0],
        { label: '...', href: undefined },
        ...finalItems.slice(-maxItems + 2),
      ]
    : finalItems;

  if (displayItems.length <= 1) {
    return null; // Ne pas afficher si un seul élément
  }

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      role="navigation"
    >
      <ol className="flex items-center gap-1" role="list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={index} className="flex items-center" role="listitem">
              {index > 0 && (
                <span className="mx-2" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}
              
              {isEllipsis ? (
                <span className="text-gray-400 px-2" aria-hidden="true">
                  ...
                </span>
              ) : isLast || !item.href ? (
                <span
                  className={`flex items-center gap-1 ${
                    isLast 
                      ? 'font-medium text-gray-900 dark:text-gray-100' 
                      : 'font-medium text-gray-600 dark:text-gray-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 rounded-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label={`Aller à ${item.label}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook pour utiliser les breadcrumbs dans les pages
export function useBreadcrumbs() {
  const pathname = usePathname();
  
  const setBreadcrumbs = React.useCallback((items: BreadcrumbItem[]) => {
    // Cette fonction pourrait être utilisée avec un contexte global
    // pour définir des breadcrumbs personnalisés
    console.log('Setting breadcrumbs:', items);
  }, []);

  const currentBreadcrumbs = React.useMemo(() => {
    return generateBreadcrumbs(pathname);
  }, [pathname]);

  return {
    breadcrumbs: currentBreadcrumbs,
    setBreadcrumbs,
  };
}

// Composant wrapper pour les pages avec breadcrumbs automatiques
interface PageWithBreadcrumbsProps {
  children: React.ReactNode;
  customBreadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  className?: string;
}

export function PageWithBreadcrumbs({
  children,
  customBreadcrumbs,
  title,
  description,
  className = '',
}: PageWithBreadcrumbsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Breadcrumbs */}
      <Breadcrumbs items={customBreadcrumbs} />
      
      {/* Header de page */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Contenu */}
      {children}
    </div>
  );
}

// Exemples d'utilisation dans les composants
export const breadcrumbExamples = {
  // Breadcrumbs personnalisés pour une page produit
  productPage: [
    { label: 'Boutique', href: '/boutique' },
    { label: 'Produits', href: '/boutique/produits' },
    { label: 'iPhone 15 Pro', current: true },
  ],
  
  // Breadcrumbs pour une page de rapport
  reportPage: [
    { label: 'Boutique', href: '/boutique' },
    { label: 'Rapports', href: '/boutique/rapports' },
    { label: 'Ventes mensuelles', current: true },
  ],
  
  // Breadcrumbs pour l'administration
  adminPage: [
    { label: 'Administration', href: '/admin' },
    { label: 'Boutiques', href: '/admin/boutiques' },
    { label: 'Nouvelle boutique', current: true },
  ],
};