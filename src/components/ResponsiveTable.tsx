'use client';

import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper pour tableaux responsives avec scroll horizontal sur mobile
 */
export default function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Table avec styles optimisés pour mobile
 */
export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <table className={`min-w-full divide-y divide-gray-300 dark:divide-gray-700 ${className}`}>
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
 * Cellule d'en-tête
 */
export function TableHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap ${className}`}
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
 * Ligne de table
 */
export function TableRow({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/**
 * Cellule de table
 */
export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap ${className}`}>
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
