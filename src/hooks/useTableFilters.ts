import { useState, useMemo, useCallback } from 'react';

export interface FilterConfig {
  searchFields: string[]; // Champs sur lesquels faire la recherche
  dateField?: string; // Champ de date pour filtrage
  statusField?: string; // Champ de statut
  amountField?: string; // Champ de montant
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export function useTableFilters<T extends Record<string, unknown>>(
  data: T[],
  config: FilterConfig
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({
    min: '',
    max: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fonction pour obtenir une valeur nested
  const getNestedValue = useCallback((obj: T, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }, []);

  // Filtrage des données
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Recherche textuelle
      if (searchTerm) {
        const matchesSearch = config.searchFields.some((field) => {
          const value = getNestedValue(item, field);
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
        if (!matchesSearch) return false;
      }

      // Filtre par statut
      if (statusFilter && config.statusField) {
        const status = getNestedValue(item, config.statusField);
        if (status !== statusFilter) return false;
      }

      // Filtre par date
      if (config.dateField && (dateRange.start || dateRange.end)) {
        const dateValue = getNestedValue(item, config.dateField);
        if (dateValue) {
          const date = new Date(String(dateValue));
          if (dateRange.start && date < new Date(dateRange.start)) return false;
          if (dateRange.end && date > new Date(dateRange.end)) return false;
        }
      }

      // Filtre par montant
      if (config.amountField && (amountRange.min || amountRange.max)) {
        const amount = Number(getNestedValue(item, config.amountField));
        if (amountRange.min && amount < Number(amountRange.min)) return false;
        if (amountRange.max && amount > Number(amountRange.max)) return false;
      }

      return true;
    });
  }, [data, searchTerm, statusFilter, dateRange, amountRange, config, getNestedValue]);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, getNestedValue]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: string) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        return {
          field,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { field, direction: 'asc' };
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setSortConfig(null);
    setCurrentPage(1);
  };

  return {
    // État
    searchTerm,
    statusFilter,
    dateRange,
    amountRange,
    sortConfig,
    currentPage,
    itemsPerPage,

    // Données
    filteredData: paginatedData,
    totalItems: sortedData.length,
    totalPages,

    // Actions
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    setAmountRange,
    handleSort,
    setCurrentPage,
    setItemsPerPage,
    resetFilters,
  };
}
