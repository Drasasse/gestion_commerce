'use client';

import React, { ReactNode, KeyboardEvent } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  caption?: string;
}

/**
 * Wrapper pour tableaux responsives avec scroll horizontal sur mobile
 * Amélioré avec support d'accessibilité
 */
export default function ResponsiveTable({ 
  children, 
  className = '', 
  ariaLabel,
  caption 
}: ResponsiveTableProps) {
  return (
    <div 
      className="overflow-x-auto -mx-4 sm:mx-0"
      role="region"
      aria-label={ariaLabel || "Tableau de données"}
      tabIndex={0}
    >
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg ${className}`}>
          {caption && (
            <div className="sr-only" role="caption">
              {caption}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Table avec styles optimisés pour mobile et accessibilité
 */
export function Table({ 
  children, 
  className = '', 
  ariaLabel,
  role = 'table'
}: { 
  children: ReactNode; 
  className?: string;
  ariaLabel?: string;
  role?: 'table' | 'grid';
}) {
  return (
    <table 
      className={`min-w-full divide-y divide-gray-300 dark:divide-gray-700 ${className}`}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </table>
  );
}

/**
 * En-tête de table
 */
export function TableHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      {children}
    </thead>
  );
}

/**
 * Cellule d'en-tête avec support d'accessibilité
 */
export function TableHeader({ 
  children, 
  className = '', 
  sortable = false,
  onSort,
  sortDirection,
  ariaLabel
}: { 
  children: ReactNode; 
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
  ariaLabel?: string;
}) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (sortable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSort?.();
    }
  };

  return (
    <th
      scope="col"
      className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap ${
        sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
      } ${className}`}
      role="columnheader"
      aria-sort={
        sortable 
          ? sortDirection === 'asc' 
            ? 'ascending' 
            : sortDirection === 'desc' 
            ? 'descending' 
            : 'none'
          : undefined
      }
      aria-label={ariaLabel}
      tabIndex={sortable ? 0 : undefined}
      onClick={sortable ? onSort : undefined}
      onKeyDown={sortable ? handleKeyDown : undefined}
    >
      {children}
    </th>
  );
}

/**
 * Corps de table
 */
export function TableBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {children}
    </tbody>
  );
}

/**
 * Ligne de table avec support d'accessibilité
 */
export function TableRow({ 
  children, 
  className = '', 
  onClick,
  ariaLabel,
  selected = false
}: { 
  children: ReactNode; 
  className?: string; 
  onClick?: () => void;
  ariaLabel?: string;
  selected?: boolean;
}) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
      } ${selected ? 'bg-blue-50 dark:bg-blue-900' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role="row"
      aria-label={ariaLabel}
      aria-selected={selected}
    >
      {children}
    </tr>
  );
}

/**
 * Cellule de table avec support d'accessibilité
 */
export function TableCell({ 
  children, 
  className = '', 
  colSpan,
  ariaLabel,
  role = 'cell'
}: { 
  children: ReactNode; 
  className?: string; 
  colSpan?: number;
  ariaLabel?: string;
  role?: 'cell' | 'gridcell';
}) {
  return (
    <td 
      className={`px-3 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap ${className}`} 
      colSpan={colSpan}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </td>
  );
}

/**
 * Carte mobile (alternative au tableau pour mobile)
 */
export function MobileCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Ligne de carte mobile
 */
export function MobileCardRow({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${className}`}>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
