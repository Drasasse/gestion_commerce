/**
 * API Helpers
 *
 * Fonctions utilitaires pour les routes API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from './auth';
import { checkRateLimit, apiRateLimiter, sensitiveApiRateLimiter } from './rate-limit';

/**
 * Wrapper pour protéger une route avec authentification et rate limiting
 */
export async function withAuthAndRateLimit(
  request: NextRequest,
  handler: (session: Session) => Promise<NextResponse>,
  options: {
    rateLimiter?: typeof apiRateLimiter | typeof sensitiveApiRateLimiter;
  } = {}
): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimiter = options.rateLimiter || apiRateLimiter;
    const rateLimitCheck = await checkRateLimit(request, rateLimiter);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Execute handler
    return await handler(session);
  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * Extraire le boutiqueId depuis la session ou les paramètres
 */
export function getBoutiqueId(
  session: Session | null,
  searchParams: URLSearchParams
): { success: true; boutiqueId: string } | { success: false; response: NextResponse } {
  const boutiqueIdParam = searchParams.get('boutiqueId');

  let boutiqueId: string;
  if (session?.user?.role === 'ADMIN' && boutiqueIdParam) {
    boutiqueId = boutiqueIdParam;
  } else if (session?.user?.boutiqueId) {
    boutiqueId = session.user.boutiqueId;
  } else {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Boutique non spécifiée' },
        { status: 400 }
      ),
    };
  }

  return { success: true, boutiqueId };
}

/**
 * Générer une clé de cache basée sur les paramètres
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const cleanParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join(':');

  return cleanParams ? `${prefix}:${cleanParams}` : prefix;
}
