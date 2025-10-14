import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseLoadingStateReturn extends LoadingState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

/**
 * Hook pour gérer les états de chargement de manière standardisée
 */
export function useLoadingState(initialState?: Partial<LoadingState>): UseLoadingStateReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    success: false,
    ...initialState,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false, success: false }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success, isLoading: false, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, success: false });
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      setSuccess(true);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      throw error;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
    withLoading,
  };
}

/**
 * Hook spécialisé pour les opérations CRUD
 */
export function useCrudLoadingState() {
  const [states, setStates] = useState({
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null as string | null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setStates(prev => ({ ...prev, loading, error: null }));
  }, []);

  const setCreating = useCallback((creating: boolean) => {
    setStates(prev => ({ ...prev, creating, error: null }));
  }, []);

  const setUpdating = useCallback((updating: boolean) => {
    setStates(prev => ({ ...prev, updating, error: null }));
  }, []);

  const setDeleting = useCallback((deleting: boolean) => {
    setStates(prev => ({ ...prev, deleting, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setStates(prev => ({ 
      ...prev, 
      error, 
      loading: false, 
      creating: false, 
      updating: false, 
      deleting: false 
    }));
  }, []);

  const reset = useCallback(() => {
    setStates({
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
    });
  }, []);

  return {
    ...states,
    setLoading,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    reset,
  };
}
