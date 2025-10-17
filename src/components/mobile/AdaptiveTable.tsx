'use client';

import React, { useState, useEffect } from 'react';
import { MobileList } from './MobileList';
import ResponsiveTable from '../ResponsiveTable';

interface AdaptiveColumn<T> {
  key: keyof T | string;
  header: string;
  label?: string; // Pour la vue mobile
  primary?: boolean;
  secondary?: boolean;
  badge?: boolean;
  icon?: React.ReactNode;
  sortable?: boolean;
  render?: (value: any, item: T, index?: number) => React.ReactNode;
  mobileRender?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  hideOnMobile?: boolean;
}

interface AdaptiveTableProps<T> {
  data: T[];
  columns: AdaptiveColumn<T>[];
  
  // Comportement
  onRowClick?: (item: T, index: number) => void;
  onRowEdit?: (item: T) => void;
  onRowDelete?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  
  // Configuration
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  selectable?: boolean;
  
  // Apparence
  title?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  
  // Mobile spécifique
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
  
  // Breakpoint pour basculer vers mobile (en pixels)
  mobileBreakpoint?: number;
}

export function AdaptiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onRowEdit,
  onRowDelete,
  onSelectionChange,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  sortable = true,
  selectable = false,
  title,
  emptyMessage = "Aucune donnée disponible",
  emptyIcon,
  loading = false,
  className = '',
  getItemId = (item) => item.id || String(Math.random()),
  getItemTitle,
  getItemSubtitle,
  getItemAvatar,
  customActions,
  mobileBreakpoint = 768
}: AdaptiveTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Détection de la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint]);

  // Gestion de la sélection
  const handleSelectionChange = (selectedItems: T[]) => {
    const newSelectedIds = new Set(selectedItems.map(getItemId));
    setSelectedRows(newSelectedIds);
    onSelectionChange?.(selectedItems);
  };

  const handleRowSelect = (item: T) => {
    const itemId = getItemId(item);
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    
    setSelectedRows(newSelected);
    
    if (onSelectionChange) {
      const selectedData = data.filter(d => newSelected.has(getItemId(d)));
      onSelectionChange(selectedData);
    }
  };

  // Préparation des colonnes pour mobile
  const mobileColumns = columns
    .filter(col => !col.hideOnMobile)
    .map(col => ({
      key: col.key,
      label: col.label || col.header,
      primary: col.primary,
      secondary: col.secondary,
      badge: col.badge,
      icon: col.icon,
      sortable: col.sortable,
      render: col.mobileRender || col.render
    }));

  if (loading) {
    return (
      <div className={`${className}`}>
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Vue mobile
  if (isMobile) {
    return (
      <div className={className}>
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
        )}
        <MobileList
          data={data}
          columns={mobileColumns}
          onItemTap={onRowClick}
          onItemEdit={onRowEdit}
          onItemDelete={onRowDelete}
          onSelectionChange={handleSelectionChange}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          sortable={sortable}
          selectable={selectable}
          emptyMessage={emptyMessage}
          emptyIcon={emptyIcon}
          getItemId={getItemId}
          getItemTitle={getItemTitle}
          getItemSubtitle={getItemSubtitle}
          getItemAvatar={getItemAvatar}
          customActions={customActions}
        />
      </div>
    );
  }

  // Vue desktop (tableau traditionnel)
  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
      )}
      
      <ResponsiveTable>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = new Set(data.map(getItemId));
                        setSelectedRows(allIds);
                        onSelectionChange?.(data);
                      } else {
                        setSelectedRows(new Set());
                        onSelectionChange?.([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0) + 1} 
                  className="px-6 py-12 text-center"
                >
                  {emptyIcon && (
                    <div className="flex justify-center mb-4 text-gray-400">
                      {emptyIcon}
                    </div>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const itemId = getItemId(item);
                const isSelected = selectedRows.has(itemId);
                
                return (
                  <tr
                    key={itemId}
                    className={`
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {selectable && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelect(item);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => {
                      const value = item[column.key];
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {column.render ? column.render(value, item, index) : String(value || '')}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {onRowEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowEdit(item);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Modifier
                          </button>
                        )}
                        {onRowDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowDelete(item);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ResponsiveTable>
    </div>
  );
}