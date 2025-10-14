/**
 * Hook React pour utiliser le cache Redis
 * Simplifie l'utilisation du cache dans les composants
 */

import { useState, useEffect, useCallback } from 'react';
import { getCacheOrFetch, setCache, deleteCache, AppCache } from '@/lib/redis';

interface UseCacheOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

/**
 * Hook principal pour le cache Redis
 */
export function useRedisCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttl = 3600,
    enabled = true,
    refetchOnMount = true
  } = options;

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await getCacheOrFetch(key, fetchFunction, ttl);
      setState({
        data,
        loading: false,
        error: null,
        lastFetched: new Date()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur de cache'
      }));
    }
  }, [key, fetchFunction, ttl, enabled]);

  const invalidate = useCallback(async () => {
    await deleteCache(key);
    setState(prev => ({ ...prev, data: null, lastFetched: null }));
  }, [key]);

  const refetch = useCallback(async () => {
    await invalidate();
    await fetchData();
  }, [invalidate, fetchData]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return {
    ...state,
    refetch,
    invalidate,
    isStale: state.lastFetched ? 
      Date.now() - state.lastFetched.getTime() > ttl * 1000 : 
      true
  };
}

/**
 * Hook spécialisé pour les produits
 */
export function useProductsCache() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await AppCache.products.get();
      setLoading(false);
      return products;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur produits');
      setLoading(false);
      return null;
    }
  }, []);

  const setProducts = useCallback(async (products: any) => {
    try {
      await AppCache.products.set(products);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde');
      return false;
    }
  }, []);

  const invalidateProducts = useCallback(async () => {
    try {
      await AppCache.products.delete();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur invalidation');
      return false;
    }
  }, []);

  return {
    getProducts,
    setProducts,
    invalidateProducts,
    loading,
    error
  };
}

/**
 * Hook spécialisé pour les clients
 */
export function useClientsCache() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clients = await AppCache.clients.get();
      setLoading(false);
      return clients;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur clients');
      setLoading(false);
      return null;
    }
  }, []);

  const setClients = useCallback(async (clients: any) => {
    try {
      await AppCache.clients.set(clients);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde');
      return false;
    }
  }, []);

  const invalidateClients = useCallback(async () => {
    try {
      await AppCache.clients.delete();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur invalidation');
      return false;
    }
  }, []);

  return {
    getClients,
    setClients,
    invalidateClients,
    loading,
    error
  };
}

/**
 * Hook pour les statistiques avec cache
 */
export function useStatsCache() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await AppCache.stats.get();
      setLoading(false);
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur statistiques');
      setLoading(false);
      return null;
    }
  }, []);

  const setStats = useCallback(async (stats: any) => {
    try {
      await AppCache.stats.set(stats);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde');
      return false;
    }
  }, []);

  const invalidateStats = useCallback(async () => {
    try {
      await AppCache.stats.delete();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur invalidation');
      return false;
    }
  }, []);

  return {
    getStats,
    setStats,
    invalidateStats,
    loading,
    error
  };
}

/**
 * Hook pour invalidation globale du cache
 */
export function useCacheManager() {
  const [loading, setLoading] = useState(false);

  const invalidateAll = useCallback(async () => {
    setLoading(true);
    try {
      await AppCache.invalidateAll();
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      return false;
    }
  }, []);

  return {
    invalidateAll,
    loading
  };
}
