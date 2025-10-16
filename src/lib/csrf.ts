/**
 * Protection CSRF (Cross-Site Request Forgery)
 *
 * Protège contre les attaques CSRF en validant les tokens
 * pour toutes les requêtes de mutation (POST, PUT, DELETE)
 */

import { nanoid } from 'nanoid';
import { redis } from './redis';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_TTL = 3600; // 1 heure
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Générer un nouveau token CSRF
 */
export async function generateCsrfToken(sessionId: string): Promise<string> {
  const token = nanoid(CSRF_TOKEN_LENGTH);
  const key = `csrf:${sessionId}`;

  try {
    // Stocker le token dans Redis avec expiration
    await redis.set(key, token, { ex: CSRF_TOKEN_TTL });
    return token;
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);
    // Fallback: générer un token sans stockage Redis
    return token;
  }
}

/**
 * Valider un token CSRF
 */
export async function validateCsrfToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  const key = `csrf:${sessionId}`;

  try {
    const storedToken = await redis.get(key);
    return storedToken === token;
  } catch (error) {
    console.error('[CSRF] Error validating token:', error);
    // En cas d'erreur Redis, on rejette par sécurité
    return false;
  }
}

/**
 * Renouveler un token CSRF
 */
export async function refreshCsrfToken(sessionId: string): Promise<string> {
  // Supprimer l'ancien token
  const key = `csrf:${sessionId}`;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('[CSRF] Error deleting old token:', error);
  }

  // Générer un nouveau token
  return generateCsrfToken(sessionId);
}

/**
 * Middleware pour vérifier le token CSRF
 */
export async function checkCsrf(request: NextRequest): Promise<{
  valid: boolean;
  response?: NextResponse;
}> {
  // Ignorer les méthodes GET, HEAD, OPTIONS
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  try {
    // Récupérer la session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        ),
      };
    }

    // Récupérer le token depuis le header
    const token = request.headers.get(CSRF_HEADER_NAME);
    if (!token) {
      console.warn('[CSRF] Token missing in request');
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Token CSRF manquant',
            message: 'La requête doit inclure un token CSRF valide',
          },
          { status: 403 }
        ),
      };
    }

    // Valider le token
    const isValid = await validateCsrfToken(session.user.id, token);
    if (!isValid) {
      console.warn('[CSRF] Invalid token for user:', session.user.id);
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Token CSRF invalide',
            message: 'Le token CSRF est invalide ou expiré',
          },
          { status: 403 }
        ),
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('[CSRF] Validation error:', error);
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Erreur de validation CSRF' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Hook pour récupérer un token CSRF côté client
 */
export function getCsrfTokenHeader(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Helper pour faire des requêtes avec token CSRF
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Récupérer le token depuis le cookie ou le localStorage
  const token = localStorage.getItem('csrf-token');

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      [CSRF_HEADER_NAME]: token || '',
    },
  });
}
