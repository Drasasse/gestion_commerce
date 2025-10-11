/**
 * Rate Limiting avec Upstash Redis
 *
 * Protection contre les abus et attaques brute-force:
 * - Login: 5 tentatives/minute
 * - API générale: 100 requêtes/minute
 * - API sensible: 10 requêtes/minute
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiter pour les tentatives de login
 * 5 tentatives par minute par IP
 */
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

/**
 * Rate limiter pour les APIs générales
 * 100 requêtes par minute par IP
 */
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Rate limiter pour les APIs sensibles (création, modification, suppression)
 * 10 requêtes par minute par IP
 */
export const sensitiveApiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:sensitive',
});

/**
 * Extraire l'IP du client depuis la requête
 */
export function getClientIp(request: NextRequest): string {
  // Essayer d'obtenir l'IP depuis les headers (pour Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }

  // Fallback sur l'IP de la requête (local dev)
  return 'unknown';
}

/**
 * Middleware helper pour appliquer le rate limiting
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  identifier?: string
): Promise<{ success: boolean; response?: NextResponse }> {
  try {
    const ip = identifier || getClientIp(request);
    const { success, limit, reset, remaining } = await limiter.limit(ip);

    // Ajouter les headers de rate limit
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    if (!success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Trop de requêtes',
            message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
            retryAfter: new Date(reset).toISOString(),
          },
          {
            status: 429,
            headers,
          }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[Rate Limit Error]:', error);
    // En cas d'erreur Redis, on laisse passer pour ne pas bloquer l'app
    return { success: true };
  }
}

/**
 * Helper pour bloquer temporairement un utilisateur après trop de tentatives échouées
 */
export async function blockUser(userId: string, durationMinutes: number = 30): Promise<void> {
  try {
    const blockKey = `blocked:user:${userId}`;
    await redis.set(blockKey, 'blocked', { ex: durationMinutes * 60 });
    console.log(`🚫 User ${userId} blocked for ${durationMinutes} minutes`);
  } catch (error) {
    console.error('[Block User Error]:', error);
  }
}

/**
 * Vérifier si un utilisateur est bloqué
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const blockKey = `blocked:user:${userId}`;
    const blocked = await redis.get(blockKey);
    return blocked === 'blocked';
  } catch (error) {
    console.error('[Check Block Error]:', error);
    return false;
  }
}

/**
 * Débloquer un utilisateur
 */
export async function unblockUser(userId: string): Promise<void> {
  try {
    const blockKey = `blocked:user:${userId}`;
    await redis.del(blockKey);
    console.log(`✅ User ${userId} unblocked`);
  } catch (error) {
    console.error('[Unblock User Error]:', error);
  }
}
