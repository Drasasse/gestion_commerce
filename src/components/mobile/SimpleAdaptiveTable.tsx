'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface SimpleColumn<T> {
  key: keyof T;
  header: string;
  label: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  mobileRender?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface SimpleAdaptiveTableProps<T> {
  data: T[];
  columns: SimpleColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  onRowClick?: (item: T) => void;
  getItemId: (item: T) => string;
  getItemTitle: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  emptyMessage?: string;
  mobileBreakpoint?: number;
  className?: string;
}

export function SimpleAdaptiveTable<T>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  sortable = false,
  onRowClick,
  getItemId,
  getItemTitle,
  getItemSubtitle,
  emptyMessage = "Aucun élément trouvé",
  mobileBreakpoint = 768,
  className = ""
}: SimpleAdaptiveTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile simple
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Filtrage et tri des données
  const processedData = useMemo(() => {
    let filtered = data;

    // Recherche
    if (searchable && searchTerm) {
      filtered = data.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Tri
    if (sortable && sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns, searchable, sortable]);

  const handleSort = (key: keyof T) => {
    if (!sortable) return;
    
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Barre de recherche */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Vue mobile - Cartes */}
      {isMobile ? (
        <div className="space-y-3">
          {processedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </div>
          ) : (
            processedData.map((item) => (
              <div
                key={getItemId(item)}
                onClick={() => onRowClick?.(item)}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 dark:active:bg-gray-700' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {getItemTitle(item)}
                  </h3>
                </div>
                
                {getItemSubtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {getItemSubtitle(item)}
                  </p>
                )}

                <div className="space-y-2">
                  {columns
                    .filter(column => !column.hideOnMobile)
                    .map((column) => {
                      const value = item[column.key];
                      const displayValue = column.mobileRender 
                        ? column.mobileRender(value, item)
                        : column.render 
                        ? column.render(value, item)
                        : String(value);

                      return (
                        <div key={String(column.key)} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {column.label}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Vue desktop - Tableau */
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    onClick={() => column.sortable && handleSort(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && sortConfig.key === column.key && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                processedData.map((item) => (
                  <tr
                    key={getItemId(item)}
                    onClick={() => onRowClick?.(item)}
                    className={`${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : ''
                    }`}
                  >
                    {columns.map((column) => {
                      const value = item[column.key];
                      const displayValue = column.render 
                        ? column.render(value, item)
                        : String(value);

                      return (
                        <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}