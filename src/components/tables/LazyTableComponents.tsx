/**
 * Composants de tables optimisés avec lazy loading
 * Réduit le bundle size initial en chargeant les bibliothèques lourdes seulement quand nécessaire
 */

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

// Skeleton spécifique pour les tables
const TableSkeleton = () => (
  <div className="space-y-4">
    {/* Header */}
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
    {/* Rows */}
    {[...Array(5)].map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="h-8 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
  </div>
);

// Skeleton pour les tables virtualisées
const VirtualTableSkeleton = () => (
  <div className="h-96 bg-gray-50 rounded-lg border">
    <div className="p-4 border-b bg-gray-100">
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    <div className="p-4 space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, j) => (
            <div key={j} className="h-6 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Table virtualisée avec lazy loading (pour de grandes quantités de données)
export const LazyVirtualTable = dynamic(
  () => import('@tanstack/react-virtual').then((mod) => 
    import('@/components/tables/VirtualTable').then((tablemod) => ({ 
      default: tablemod.default 
    }))
  ).catch(() => ({
    default: () => <div className="p-4 text-center text-gray-500">Table virtualisée non disponible</div>
  })),
  {
    loading: () => <VirtualTableSkeleton />,
    ssr: false,
  }
);

// Data Grid avancé avec tri, filtrage, pagination
export const LazyDataGrid = dynamic(
  () => import('@/components/tables/DataGrid').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <TableSkeleton />
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: false,
  }
);

// Table avec export Excel/CSV
export const LazyExportableTable = dynamic(
  () => import('@/components/tables/ExportableTable').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <TableSkeleton />
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: false,
  }
);

// Table avec édition inline
export const LazyEditableTable = dynamic(
  () => import('@/components/tables/EditableTable').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <TableSkeleton />
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: false,
  }
);

// Table avec drag & drop pour réorganiser
export const LazyDragDropTable = dynamic(
  () => import('@/components/tables/DragDropTable').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <TableSkeleton />
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: false,
  }
);

// Composant wrapper pour tables avec gestion d'erreur et loading
interface LazyTableWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export const LazyTableWrapper: React.FC<LazyTableWrapperProps> = ({ 
  children, 
  title, 
  className = "",
  loading = false,
  error = null,
  emptyMessage = "Aucune donnée disponible"
}) => {
  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium">Erreur de chargement</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
      )}
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// Hook pour la virtualisation de tables
export const useLazyTableVirtualization = () => {
  return dynamic(
    () => import('@tanstack/react-virtual').then((mod) => ({ 
      default: () => mod.useVirtualizer 
    })),
    { ssr: false }
  );
};

// Export par défaut avec tous les composants
export default {
  VirtualTable: LazyVirtualTable,
  DataGrid: LazyDataGrid,
  ExportableTable: LazyExportableTable,
  EditableTable: LazyEditableTable,
  DragDropTable: LazyDragDropTable,
  TableWrapper: LazyTableWrapper,
  useVirtualization: useLazyTableVirtualization,
};