/**
 * Configuration Redis avec Upstash
 *
 * Ce fichier configure la connexion à Upstash Redis pour:
 * - Rate limiting
 * - Caching
 * - Sessions
 */

import { Redis } from '@upstash/redis';

// Validation des variables d'environnement
if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined in environment variables');
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined in environment variables');
}

// Instance Redis singleton
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Utility function pour wrapper les appels Redis avec gestion d'erreur
 */
export async function safeRedisCall<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[Redis Error] ${operationName}:`, error);
    return fallback;
  }
}

/**
 * Test de connexion Redis
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    console.log('✅ Redis connection successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

/**
 * Cache générique avec TTL
 */
export async function setCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 3600
): Promise<boolean> {
  return safeRedisCall(
    async () => {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    },
    false,
    `setCache(${key})`
  );
}

/**
 * Récupération du cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return safeRedisCall(
    async () => {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    },
    null,
    `getCache(${key})`
  );
}

/**
 * Cache avec fonction de fallback
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Essayer de récupérer du cache d'abord
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si pas en cache, exécuter la fonction et mettre en cache
  const data = await fetchFunction();
  await setCache(key, data, ttlSeconds);
  return data;
}

/**
 * Suppression du cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  return safeRedisCall(
    async () => {
      await redis.del(key);
      return true;
    },
    false,
    `deleteCache(${key})`
  );
}

/**
 * Suppression de cache par pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  return safeRedisCall(
    async () => {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    },
    0,
    `deleteCachePattern(${pattern})`
  );
}

/**
 * Rate limiting
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`;
  
  return safeRedisCall(
    async () => {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetTime
      };
    },
    { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowSeconds * 1000 },
    `checkRateLimit(${identifier})`
  );
}

// Types pour les données de cache
interface UserSessionData {
  id: string;
  email: string;
  role: string;
  boutiqueId?: string;
  [key: string]: unknown;
}

interface ProductData {
  id: string;
  nom: string;
  prix: number;
  [key: string]: unknown;
}

interface ClientData {
  id: string;
  nom: string;
  email: string;
  [key: string]: unknown;
}

interface OrderData {
  id: string;
  clientId: string;
  total: number;
  [key: string]: unknown;
}

interface StatsData {
  totalVentes: number;
  totalClients: number;
  totalProduits: number;
  [key: string]: unknown;
}

/**
 * Cache pour les sessions utilisateur
 */
export async function setUserSession(
  userId: string, 
  sessionData: UserSessionData, 
  ttlSeconds: number = 86400 // 24h par défaut
): Promise<boolean> {
  return setCache(`session:${userId}`, sessionData, ttlSeconds);
}

export async function getUserSession<T = UserSessionData>(userId: string): Promise<T | null> {
  return getCache<T>(`session:${userId}`);
}

export async function deleteUserSession(userId: string): Promise<boolean> {
  return deleteCache(`session:${userId}`);
}

/**
 * Cache pour les données de l'application
 */
export const AppCache = {
  // Cache des produits
  products: {
    set: (data: ProductData[], ttl = 1800) => setCache('app:products', data, ttl), // 30 min
    get: () => getCache<ProductData[]>('app:products'),
    delete: () => deleteCache('app:products')
  },
  
  // Cache des clients
  clients: {
    set: (data: ClientData[], ttl = 3600) => setCache('app:clients', data, ttl), // 1h
    get: () => getCache<ClientData[]>('app:clients'),
    delete: () => deleteCache('app:clients')
  },
  
  // Cache des commandes
  orders: {
    set: (data: OrderData[], ttl = 900) => setCache('app:orders', data, ttl), // 15 min
    get: () => getCache<OrderData[]>('app:orders'),
    delete: () => deleteCache('app:orders')
  },
  
  // Cache des statistiques
  stats: {
    set: (data: StatsData, ttl = 1800) => setCache('app:stats', data, ttl), // 30 min
    get: () => getCache<StatsData>('app:stats'),
    delete: () => deleteCache('app:stats')
  },
  
  // Invalidation globale
  invalidateAll: () => deleteCachePattern('app:*')
};

/**
 * Métriques de cache
 */
export async function getCacheMetrics(): Promise<{
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
}> {
  return safeRedisCall(
    async () => {
      // Upstash Redis ne supporte pas info(), on utilise dbsize() seulement
      const keys = await redis.dbsize();
      
      return {
        totalKeys: keys,
        memoryUsage: 'N/A', // Non disponible avec Upstash Redis REST API
        hitRate: 0 // À implémenter avec des compteurs personnalisés
      };
    },
    { totalKeys: 0, memoryUsage: 'N/A', hitRate: 0 },
    'getCacheMetrics'
  );
}
