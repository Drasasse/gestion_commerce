'use client';

import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';

interface AdvancedFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filtre par statut
  showStatusFilter?: boolean;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;

  // Filtre par date
  showDateFilter?: boolean;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;

  // Filtre par montant
  showAmountFilter?: boolean;
  amountRange?: { min: string; max: string };
  onAmountRangeChange?: (range: { min: string; max: string }) => void;

  // Actions
  onReset?: () => void;
  totalItems?: number;
}

export default function AdvancedFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  showStatusFilter = false,
  statusFilter,
  onStatusChange,
  statusOptions = [],
  showDateFilter = false,
  dateRange,
  onDateRangeChange,
  showAmountFilter = false,
  amountRange,
  onAmountRangeChange,
  onReset,
  totalItems,
}: AdvancedFiltersProps) {
  const hasActiveFilters =
    searchTerm ||
    statusFilter ||
    (dateRange && (dateRange.start || dateRange.end)) ||
    (amountRange && (amountRange.min || amountRange.max));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filtres avancés</h3>
        {totalItems !== undefined && (
          <span className="ml-auto text-sm text-gray-500">
            {totalItems} résultat{totalItems > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche textuelle */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtre par statut */}
        {showStatusFilter && onStatusChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtre par date */}
        {showDateFilter && onDateRangeChange && dateRange && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date début
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date fin
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Filtre par montant */}
        {showAmountFilter && onAmountRangeChange && amountRange && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Montant min
              </label>
              <input
                type="number"
                value={amountRange.min}
                onChange={(e) =>
                  onAmountRangeChange({ ...amountRange, min: e.target.value })
                }
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Montant max
              </label>
              <input
                type="number"
                value={amountRange.max}
                onChange={(e) =>
                  onAmountRangeChange({ ...amountRange, max: e.target.value })
                }
                placeholder="∞"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}
      </div>

      {/* Bouton reset */}
      {hasActiveFilters && onReset && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
