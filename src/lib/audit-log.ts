/**
 * Audit Logging System
 *
 * Système de logs pour tracer les actions importantes des utilisateurs
 */

import { prisma } from './prisma';

/**
 * Types d'actions auditables
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // Produits
  PRODUIT_CREATE = 'PRODUIT_CREATE',
  PRODUIT_UPDATE = 'PRODUIT_UPDATE',
  PRODUIT_DELETE = 'PRODUIT_DELETE',

  // Catégories
  CATEGORIE_CREATE = 'CATEGORIE_CREATE',
  CATEGORIE_UPDATE = 'CATEGORIE_UPDATE',
  CATEGORIE_DELETE = 'CATEGORIE_DELETE',

  // Ventes
  VENTE_CREATE = 'VENTE_CREATE',
  VENTE_UPDATE = 'VENTE_UPDATE',
  VENTE_DELETE = 'VENTE_DELETE',

  // Clients
  CLIENT_CREATE = 'CLIENT_CREATE',
  CLIENT_UPDATE = 'CLIENT_UPDATE',
  CLIENT_DELETE = 'CLIENT_DELETE',

  // Stocks
  STOCK_UPDATE = 'STOCK_UPDATE',
  STOCK_MOUVEMENT = 'STOCK_MOUVEMENT',

  // Fournisseurs
  FOURNISSEUR_CREATE = 'FOURNISSEUR_CREATE',
  FOURNISSEUR_UPDATE = 'FOURNISSEUR_UPDATE',
  FOURNISSEUR_DELETE = 'FOURNISSEUR_DELETE',

  // Commandes
  COMMANDE_CREATE = 'COMMANDE_CREATE',
  COMMANDE_UPDATE = 'COMMANDE_UPDATE',
  COMMANDE_RECEIVE = 'COMMANDE_RECEIVE',
  COMMANDE_DELETE = 'COMMANDE_DELETE',

  // Transactions
  TRANSACTION_CREATE = 'TRANSACTION_CREATE',
  TRANSACTION_UPDATE = 'TRANSACTION_UPDATE',
  TRANSACTION_DELETE = 'TRANSACTION_DELETE',

  // Paiements
  PAIEMENT_CREATE = 'PAIEMENT_CREATE',
  PAIEMENT_UPDATE = 'PAIEMENT_UPDATE',
  PAIEMENT_DELETE = 'PAIEMENT_DELETE',

  // Users
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // Boutiques
  BOUTIQUE_CREATE = 'BOUTIQUE_CREATE',
  BOUTIQUE_UPDATE = 'BOUTIQUE_UPDATE',
  BOUTIQUE_DELETE = 'BOUTIQUE_DELETE',
}

/**
 * Niveaux de sévérité
 */
export enum AuditLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Interface pour les données d'audit
 */
export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  boutiqueId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  level?: AuditLevel;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Logger un événement d'audit dans la console
 * En production, ceci devrait être envoyé vers un service externe (Datadog, Sentry, etc.)
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const level = data.level || AuditLevel.INFO;
    const success = data.success !== undefined ? data.success : true;

    // Log structuré pour faciliter le parsing
    const logEntry = {
      timestamp,
      level,
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      boutiqueId: data.boutiqueId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    };

    // Console log avec couleurs selon le niveau
    const prefix = success ? '✅' : '❌';
    const color = {
      INFO: '\x1b[36m',     // Cyan
      WARNING: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m',    // Red
      CRITICAL: '\x1b[35m', // Magenta
    }[level];
    const reset = '\x1b[0m';

    console.log(
      `${color}[AUDIT ${level}]${reset} ${prefix} ${data.action} by ${data.userEmail || data.userId || 'unknown'} - ${data.resourceType}${data.resourceId ? `:${data.resourceId}` : ''}`
    );

    // En production, envoyer vers un service externe
    if (process.env.NODE_ENV === 'production') {
      // TODO: Envoyer vers Datadog, Sentry, ou autre service de logging
      // await sendToLoggingService(logEntry);
    }

    // Optionnel: Stocker en DB pour les actions critiques
    if (level === AuditLevel.CRITICAL || level === AuditLevel.ERROR) {
      await storeAuditLogInDatabase(logEntry);
    }
  } catch (error) {
    // Ne jamais faire échouer l'opération principale à cause d'un problème de logging
    console.error('[Audit Log Error]:', error);
  }
}

/**
 * Stocker les logs critiques en base de données
 * Nécessite une table audit_logs (à créer dans le schema Prisma)
 */
async function storeAuditLogInDatabase(logEntry: unknown): Promise<void> {
  try {
    // TODO: Créer un modèle AuditLog dans Prisma
    // await prisma.auditLog.create({
    //   data: logEntry,
    // });
    console.log('[Audit] Critical log would be stored in DB:', logEntry);
  } catch (error) {
    console.error('[Audit] Failed to store in database:', error);
  }
}

/**
 * Helper pour logger une action de création
 */
export function logCreate(
  resourceType: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  return logAudit({
    action: `${resourceType.toUpperCase()}_CREATE` as AuditAction,
    resourceType,
    resourceId,
    userId,
    metadata,
    level: AuditLevel.INFO,
    success: true,
  });
}

/**
 * Helper pour logger une action de mise à jour
 */
export function logUpdate(
  resourceType: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  return logAudit({
    action: `${resourceType.toUpperCase()}_UPDATE` as AuditAction,
    resourceType,
    resourceId,
    userId,
    metadata,
    level: AuditLevel.INFO,
    success: true,
  });
}

/**
 * Helper pour logger une action de suppression
 */
export function logDelete(
  resourceType: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  return logAudit({
    action: `${resourceType.toUpperCase()}_DELETE` as AuditAction,
    resourceType,
    resourceId,
    userId,
    metadata,
    level: AuditLevel.WARNING,
    success: true,
  });
}

/**
 * Helper pour logger une action échouée
 */
export function logFailure(
  action: AuditAction,
  resourceType: string,
  errorMessage: string,
  userId?: string,
  metadata?: Record<string, unknown>
) {
  return logAudit({
    action,
    resourceType,
    userId,
    errorMessage,
    metadata,
    level: AuditLevel.ERROR,
    success: false,
  });
}

/**
 * Extraire l'IP depuis une requête Next.js
 */
export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Extraire le User-Agent depuis une requête
 */
export function getUserAgentFromRequest(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
