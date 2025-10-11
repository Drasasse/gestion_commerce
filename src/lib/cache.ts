/**
 * Système de cache avec Redis
 *
 * Permet de mettre en cache des données fréquemment accédées:
 * - Produits
 * - Catégories
 * - Statistiques
 * - Rapports
 */

import { redis, safeRedisCall } from './redis';

/**
 * Options de cache
 */
export interface CacheOptions {
  /** Durée de vie en secondes (default: 5 minutes) */
  ttl?: number;
  /** Préfixe pour la clé (default: 'cache') */
  prefix?: string;
  /** Tags pour l'invalidation groupée */
  tags?: string[];
}

const DEFAULT_TTL = 300; // 5 minutes
const DEFAULT_PREFIX = 'cache';

/**
 * Générer une clé de cache
 */
function getCacheKey(key: string, prefix: string = DEFAULT_PREFIX): string {
  return `${prefix}:${key}`;
}

/**
 * Récupérer une valeur du cache
 */
export async function getCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  const cacheKey = getCacheKey(key, options.prefix);

  return safeRedisCall(
    async () => {
      const data = await redis.get(cacheKey);
      if (!data) return null;

      console.log(`[Cache HIT] ${cacheKey}`);

      // Si c'est déjà un objet, le retourner directement
      if (typeof data === 'object') {
        return data as T;
      }

      // Sinon, parser comme JSON
      return JSON.parse(data as string) as T;
    },
    null,
    `getCache(${cacheKey})`
  );
}

/**
 * Stocker une valeur dans le cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const cacheKey = getCacheKey(key, options.prefix);
  const ttl = options.ttl || DEFAULT_TTL;

  await safeRedisCall(
    async () => {
      await redis.set(cacheKey, JSON.stringify(value), { ex: ttl });

      // Stocker les tags pour l'invalidation groupée
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `tag:${tag}`;
          await redis.sadd(tagKey, cacheKey);
          // Le tag expire après le TTL aussi
          await redis.expire(tagKey, ttl);
        }
      }

      console.log(`[Cache SET] ${cacheKey} (TTL: ${ttl}s)`);
    },
    undefined,
    `setCache(${cacheKey})`
  );
}

/**
 * Supprimer une valeur du cache
 */
export async function deleteCache(key: string, options: CacheOptions = {}): Promise<void> {
  const cacheKey = getCacheKey(key, options.prefix);

  await safeRedisCall(
    async () => {
      await redis.del(cacheKey);
      console.log(`[Cache DELETE] ${cacheKey}`);
    },
    undefined,
    `deleteCache(${cacheKey})`
  );
}

/**
 * Invalider tous les caches avec un tag donné
 */
export async function invalidateByTag(tag: string): Promise<void> {
  const tagKey = `tag:${tag}`;

  await safeRedisCall(
    async () => {
      const keys = await redis.smembers(tagKey);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key) => redis.del(key as string)));
        await redis.del(tagKey);
        console.log(`[Cache INVALIDATE TAG] ${tag} (${keys.length} keys)`);
      }
    },
    undefined,
    `invalidateByTag(${tag})`
  );
}

/**
 * Invalider tous les caches avec un pattern
 */
export async function invalidateByPattern(pattern: string): Promise<void> {
  await safeRedisCall(
    async () => {
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key) => redis.del(key as string)));
        console.log(`[Cache INVALIDATE PATTERN] ${pattern} (${keys.length} keys)`);
      }
    },
    undefined,
    `invalidateByPattern(${pattern})`
  );
}

/**
 * Wrapper pour récupérer ou calculer une valeur
 * Si la valeur est en cache, la retourne
 * Sinon, appelle la fonction fetcher et met en cache le résultat
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Essayer de récupérer depuis le cache
  const cached = await getCache<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Si pas en cache, calculer la valeur
  console.log(`[Cache MISS] ${key} - Fetching...`);
  const data = await fetcher();

  // Mettre en cache pour la prochaine fois
  await setCache(key, data, options);

  return data;
}

/**
 * Préfixes de cache recommandés pour l'application
 */
export const CachePrefix = {
  PRODUITS: 'produits',
  CATEGORIES: 'categories',
  CLIENTS: 'clients',
  VENTES: 'ventes',
  STOCKS: 'stocks',
  STATS: 'stats',
  RAPPORTS: 'rapports',
  USER: 'user',
  BOUTIQUE: 'boutique',
} as const;

/**
 * Tags de cache recommandés pour l'invalidation groupée
 */
export const CacheTag = {
  PRODUITS: 'produits',
  CATEGORIES: 'categories',
  CLIENTS: 'clients',
  VENTES: 'ventes',
  STOCKS: 'stocks',
  TRANSACTIONS: 'transactions',
  BOUTIQUE: 'boutique',
} as const;

/**
 * TTL recommandés par type de données
 */
export const CacheTTL = {
  /** 1 minute - Pour les données qui changent fréquemment */
  SHORT: 60,
  /** 5 minutes - Pour les données modérément dynamiques */
  MEDIUM: 300,
  /** 15 minutes - Pour les données relativement stables */
  LONG: 900,
  /** 1 heure - Pour les données très stables */
  VERY_LONG: 3600,
  /** 24 heures - Pour les données quasi-statiques */
  DAY: 86400,
} as const;
