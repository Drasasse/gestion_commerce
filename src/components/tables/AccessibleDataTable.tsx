'use client';

import React, { useState, useCallback } from 'react';
import ResponsiveTable from '../ResponsiveTable';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

interface DataItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface AccessibleDataTableProps {
  data: DataItem[];
  title?: string;
  selectable?: boolean;
  onRowSelect?: (item: DataItem) => void;
}

type SortField = keyof DataItem;
type SortDirection = 'asc' | 'desc' | null;

export function AccessibleDataTable({ 
  data, 
  title = "Table de données", 
  selectable = false,
  onRowSelect 
}: AccessibleDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleRowSelect = useCallback((item: DataItem) => {
    if (selectable) {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
      onRowSelect?.(item);
    }
  }, [selectable, onRowSelect]);

  const sortedData = React.useMemo(() => {
    if (!sortDirection) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} élément{data.length > 1 ? 's' : ''}
          {selectedRows.size > 0 && ` • ${selectedRows.size} sélectionné${selectedRows.size > 1 ? 's' : ''}`}
        </div>
      </div>

      <ResponsiveTable ariaLabel={`${title} avec ${data.length} éléments`}>
        <table 
          role="grid" 
          aria-label={title}
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        >
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                onClick={() => handleSort('name')}
                aria-label="Trier par nom"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                Nom {getSortIcon('name')}
              </th>
              <th
                onClick={() => handleSort('email')}
                aria-label="Trier par email"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                Email {getSortIcon('email')}
              </th>
              <th
                onClick={() => handleSort('role')}
                aria-label="Trier par rôle"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                Rôle {getSortIcon('role')}
              </th>
              <th
                onClick={() => handleSort('status')}
                aria-label="Trier par statut"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                Statut {getSortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => (
              <tr
                key={item.id}
                onClick={selectable ? () => handleRowSelect(item) : undefined}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedRows.has(item.id) ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                aria-label={`${item.name}, ${item.email}, ${item.role}, ${item.status}`}
              >
                <td 
                  role="gridcell"
                  aria-label={`Nom: ${item.name}`}
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {item.name}
                </td>
                <td 
                  role="gridcell"
                  aria-label={`Email: ${item.email}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {item.email}
                </td>
                <td 
                  role="gridcell"
                  aria-label={`Rôle: ${item.role}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {item.role}
                </td>
                <td 
                  role="gridcell"
                  aria-label={`Statut: ${item.status}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {item.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>

      {/* Instructions d'accessibilité pour les utilisateurs de lecteurs d'écran */}
      <div className="sr-only" aria-live="polite">
        Table triée par {sortField} en ordre {sortDirection === 'asc' ? 'croissant' : 'décroissant'}.
        {selectedRows.size > 0 && `${selectedRows.size} ligne${selectedRows.size > 1 ? 's' : ''} sélectionnée${selectedRows.size > 1 ? 's' : ''}.`}
        Utilisez les flèches pour naviguer, Entrée ou Espace pour sélectionner.
      </div>
    </div>
  );
}