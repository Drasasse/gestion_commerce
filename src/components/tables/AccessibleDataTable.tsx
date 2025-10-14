'use client';

import React, { useState, useCallback } from 'react';
import { ResponsiveTable, Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../ResponsiveTable';
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
        <Table 
          role="grid" 
          ariaLabel={title}
        >
          <TableHead>
            <TableRow>
              <TableHeader
                sortable
                onSort={() => handleSort('name')}
                sortDirection={sortField === 'name' ? sortDirection : null}
                ariaLabel="Trier par nom"
                className="flex items-center gap-2"
              >
                Nom {getSortIcon('name')}
              </TableHeader>
              <TableHeader
                sortable
                onSort={() => handleSort('email')}
                sortDirection={sortField === 'email' ? sortDirection : null}
                ariaLabel="Trier par email"
                className="flex items-center gap-2"
              >
                Email {getSortIcon('email')}
              </TableHeader>
              <TableHeader
                sortable
                onSort={() => handleSort('role')}
                sortDirection={sortField === 'role' ? sortDirection : null}
                ariaLabel="Trier par rôle"
                className="flex items-center gap-2"
              >
                Rôle {getSortIcon('role')}
              </TableHeader>
              <TableHeader
                sortable
                onSort={() => handleSort('status')}
                sortDirection={sortField === 'status' ? sortDirection : null}
                ariaLabel="Trier par statut"
                className="flex items-center gap-2"
              >
                Statut {getSortIcon('status')}
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow
                key={item.id}
                onClick={selectable ? () => handleRowSelect(item) : undefined}
                selected={selectedRows.has(item.id)}
                ariaLabel={`${item.name}, ${item.email}, ${item.role}, ${item.status}`}
              >
                <TableCell 
                  role="gridcell"
                  ariaLabel={`Nom: ${item.name}`}
                >
                  {item.name}
                </TableCell>
                <TableCell 
                  role="gridcell"
                  ariaLabel={`Email: ${item.email}`}
                >
                  {item.email}
                </TableCell>
                <TableCell 
                  role="gridcell"
                  ariaLabel={`Rôle: ${item.role}`}
                >
                  {item.role}
                </TableCell>
                <TableCell 
                  role="gridcell"
                  ariaLabel={`Statut: ${item.status}`}
                >
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {item.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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