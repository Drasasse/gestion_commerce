/**
 * Dynamic Import Utilities
 *
 * Helpers pour le code splitting et chargement dynamique
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Options pour le chargement dynamique
 */
interface DynamicOptions {
  /** Composant de chargement */
  loading?: ComponentType;
  /** Désactiver le SSR */
  ssr?: boolean;
}

/**
 * Loader par défaut
 */
export const DefaultLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Wrapper pour dynamic import avec loader par défaut
 */
export function dynamicImport<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || DefaultLoader,
    ssr: options.ssr !== false,
  });
}

/**
 * Import dynamique pour les graphiques (lourds)
 */
export const DynamicChart = dynamicImport(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { ssr: false }
);

/**
 * Import dynamique pour les éditeurs de texte
 */
export const DynamicEditor = dynamicImport(
  () => import('@/components/Editor').catch(() => ({ default: () => <div>Editor non disponible</div> })),
  { ssr: false }
);

/**
 * Hook pour charger des données de manière lazy
 */
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}
