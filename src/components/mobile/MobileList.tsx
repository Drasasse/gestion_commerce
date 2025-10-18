'use client';

import React, { useState, useCallback } from 'react';
import { Search, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { MobileCard, MobileCardActions } from './MobileCard';

interface MobileListColumn<T> {
  key: keyof T | string;
  label: string;
  primary?: boolean;
  secondary?: boolean;
  badge?: boolean;
  icon?: React.ReactNode;
  render?: (value: unknown, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface MobileListProps<T> {
  data: T[];
  columns: MobileListColumn<T>[];
  onItemTap?: (item: T) => void;
  onItemLongPress?: (item: T) => void;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  getItemId?: (item: T) => string;
  getItemTitle?: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  getItemAvatar?: (item: T) => React.ReactNode;
  customActions?: (item: T) => Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

type SortDirection = 'asc' | 'desc' | null;

export function MobileList<T extends Record<string, unknown>>({
  data,
  columns,
  onItemTap,
  onItemLongPress,
  onItemEdit,
  onItemDelete,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  sortable = true,
  selectable = false,
  onSelectionChange,
  emptyMessage = "Aucun élément trouvé",
  emptyIcon,
  loading = false,
  className = '',
  getItemId = (item) => (item as any).id || String(Math.random()),
  getItemTitle,
  getItemSubtitle,
  getItemAvatar,
  customActions
}: MobileListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filtrage et tri des données
  const processedData = React.useMemo(() => {
    let filtered = data;

    // Recherche
    if (searchTerm && searchable) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Tri
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = String(a[sortColumn] || '');
        const bValue = String(b[sortColumn] || '');
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, columns, searchable]);

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleItemSelect = useCallback((item: T) => {
    const itemId = getItemId(item);
    const newSelected = new Set(selectedItems);
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    
    setSelectedItems(newSelected);
    
    if (onSelectionChange) {
      const selectedData = data.filter(d => newSelected.has(getItemId(d)));
      onSelectionChange(selectedData);
    }
  }, [selectedItems, data, getItemId, onSelectionChange]);

  const renderCard = (item: T) => {
    const itemId = getItemId(item);
    const isSelected = selectedItems.has(itemId);
    
    const fields = columns.map(column => ({
      label: column.label,
      value: column.render 
        ? column.render(item[column.key], item)
        : String(item[column.key] || ''),
      primary: column.primary,
      secondary: column.secondary,
      badge: column.badge,
      icon: column.icon
    }));

    const actions = (
      <MobileCardActions
        onEdit={onItemEdit ? () => onItemEdit(item) : undefined}
        onDelete={onItemDelete ? () => onItemDelete(item) : undefined}
        customActions={customActions ? customActions(item) : undefined}
      />
    );

    return (
      <MobileCard
        key={itemId}
        fields={fields}
        onTap={selectable ? () => handleItemSelect(item) : onItemTap ? () => onItemTap(item) : undefined}
        onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
        selected={isSelected}
        actions={actions}
        title={getItemTitle ? getItemTitle(item) : undefined}
        subtitle={getItemSubtitle ? getItemSubtitle(item) : undefined}
        avatar={getItemAvatar ? getItemAvatar(item) : undefined}
        className="mb-3"
      />
    );
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Barre d'outils */}
      <div className="mb-4 space-y-3">
        {/* Recherche */}
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Contrôles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Tri */}
            {sortable && (
              <div className="flex items-center space-x-1">
                {columns.filter(col => col.sortable !== false).map(column => (
                  <button
                    key={String(column.key)}
                    onClick={() => handleSort(String(column.key))}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${sortColumn === column.key 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortColumn === column.key && (
                        sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode d'affichage */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sélection */}
        {selectable && selectedItems.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedItems.size} élément{selectedItems.size > 1 ? 's' : ''} sélectionné{selectedItems.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setSelectedItems(new Set());
                  onSelectionChange?.([]);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Désélectionner tout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste/Grille */}
      {processedData.length === 0 ? (
        <div className="text-center py-12">
          {emptyIcon && (
            <div className="flex justify-center mb-4 text-gray-400">
              {emptyIcon}
            </div>
          )}
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
          {processedData.map((item) => (
            <div key={getItemId(item)}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}