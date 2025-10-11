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
