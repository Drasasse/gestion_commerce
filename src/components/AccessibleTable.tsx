/**
 * Composant de table accessible avec support complet pour:
 * - Navigation au clavier
 * - Screen readers
 * - Tri des colonnes
 * - Sélection multiple
 * - Pagination
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, MoreHorizontal, Check, ArrowUpDown } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import { useDesignTokens } from '@/hooks/useDesignTokens';

// Types
interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  ariaLabel?: string;
}

interface AccessibleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  caption?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowClick?: (row: T, index: number) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  searchable?: boolean;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  ariaLabel?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function AccessibleTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  caption,
  selectable = false,
  onSelectionChange,
  onRowClick,
  pagination,
  searchable = false,
  onSearch,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
  rowClassName,
  ariaLabel,
}: AccessibleTableProps<T>) {
  const tokens = useDesignTokens();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Gestion du tri
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc';
    }

    setSortColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);
  }, [sortColumn, sortDirection, columns]);

  // Gestion de la sélection
  const handleRowSelection = useCallback((index: number, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedData = Array.from(newSelection).map(i => data[i]);
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange]);

  // Sélection de toutes les lignes
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIndices = new Set(data.map((_, index) => index));
      setSelectedRows(allIndices);
      onSelectionChange?.(data);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  }, [data, onSelectionChange]);

  // Navigation au clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const totalRows = data.length;
    const totalCols = columns.length + (selectable ? 1 : 0);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setFocusedCell({ row: rowIndex - 1, col: colIndex });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          setFocusedCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          setFocusedCell({ row: rowIndex, col: colIndex - 1 });
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < totalCols - 1) {
          setFocusedCell({ row: rowIndex, col: colIndex + 1 });
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (selectable && colIndex === 0) {
          handleRowSelection(rowIndex, !selectedRows.has(rowIndex));
        } else if (onRowClick) {
          onRowClick(data[rowIndex], rowIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedCell({ row: rowIndex, col: 0 });
        break;
      case 'End':
        e.preventDefault();
        setFocusedCell({ row: rowIndex, col: totalCols - 1 });
        break;
    }
  }, [data, columns, selectable, selectedRows, onRowClick, handleRowSelection]);

  // Focus management
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const cell = tableRef.current.querySelector(
        `[data-row="${focusedCell.row}"][data-col="${focusedCell.col}"]`
      ) as HTMLElement;
      cell?.focus();
    }
  }, [focusedCell]);

  // Recherche
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  // Données triées
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Header avec recherche */}
      {searchable && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Rechercher dans le tableau"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          className="w-full"
          role="table"
          aria-label={ariaLabel || caption || 'Tableau de données'}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr role="row">
              {selectable && (
                <th
                  scope="col"
                  className="w-12 px-4 py-3 text-left"
                  role="columnheader"
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label="Sélectionner toutes les lignes"
                  />
                </th>
              )}
              
              {columns.map((column, index) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-4 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                  role="columnheader"
                  aria-sort={
                    sortColumn === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : column.sortable
                      ? 'none'
                      : undefined
                  }
                  aria-label={column.ariaLabel || column.header}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="ml-1">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${
                    selectedRows.has(rowIndex) ? 'bg-blue-50' : ''
                  } ${rowClassName?.(row, rowIndex) || ''} ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  role="row"
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" role="gridcell">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={(e) => handleRowSelection(rowIndex, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Sélectionner la ligne ${rowIndex + 1}`}
                        data-row={rowIndex}
                        data-col={0}
                        tabIndex={focusedCell?.row === rowIndex && focusedCell?.col === 0 ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                      />
                    </td>
                  )}
                  
                  {columns.map((column, colIndex) => {
                    const cellIndex = colIndex + (selectable ? 1 : 0);
                    const value = row[column.key as keyof T];
                    
                    return (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-3 text-${column.align || 'left'} text-sm text-gray-900`}
                        role="gridcell"
                        data-row={rowIndex}
                        data-col={cellIndex}
                        tabIndex={focusedCell?.row === rowIndex && focusedCell?.col === cellIndex ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, cellIndex)}
                      >
                        {column.render ? column.render(value, row, rowIndex) : String(value || '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.currentPage} sur {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Page précédente"
            >
              Précédent
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Page suivante"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}