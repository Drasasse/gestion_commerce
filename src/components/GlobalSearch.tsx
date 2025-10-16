'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'vente' | 'client' | 'produit' | 'transaction' | 'page';
  url: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Pages prédéfinies
  const pages: SearchResult[] = [
    { id: 'ventes', title: 'Ventes', type: 'page', url: '/boutique/ventes' },
    { id: 'produits', title: 'Produits', type: 'page', url: '/boutique/produits' },
    { id: 'clients', title: 'Clients', type: 'page', url: '/boutique/clients' },
    { id: 'transactions', title: 'Transactions', type: 'page', url: '/boutique/transactions' },
    { id: 'stocks', title: 'Stocks', type: 'page', url: '/boutique/stocks' },
    { id: 'rapports', title: 'Rapports', type: 'page', url: '/boutique/rapports' },
    { id: 'categories', title: 'Catégories', type: 'page', url: '/boutique/categories' },
    { id: 'paiements', title: 'Paiements', type: 'page', url: '/boutique/paiements' },
  ];

  // Recherche
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      // Recherche dans les pages
      const pageResults = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(pageResults);
    },
    [pages]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200); // Debounce

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Sauvegarder dans les recherches récentes
    const newRecent = [
      result.title,
      ...recentSearches.filter((r) => r !== result.title),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Naviguer
    router.push(result.url);
    onClose();
  }, [recentSearches, router, onClose]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelect]);

  // Réinitialiser lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal de recherche */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Barre de recherche */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des pages, ventes, clients, produits..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Résultats */}
        <div className="max-h-96 overflow-y-auto">
          {query && results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Résultats
              </div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun résultat trouvé</p>
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recherches récentes
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pages populaires
              </div>
              {pages.slice(0, 5).map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{page.title}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer avec raccourci clavier */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>Utilisez ↑ ↓ pour naviguer</span>
          <span>↵ pour sélectionner</span>
          <span>ESC pour fermer</span>
        </div>
      </div>
    </div>
  );
}

// Hook pour utiliser la recherche globale
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
