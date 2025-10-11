/**
 * Système de Gestion Centralisée des Erreurs
 * Fournit des classes d'erreurs personnalisées et des handlers
 */

// ==================== Classes d'Erreurs ====================

/**
 * Erreur de base de l'application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Maintient la stack trace correcte
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation des données
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Erreur d'authentification
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401, true, 'AUTH_ERROR');
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Erreur d'autorisation
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Accès refusé') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Erreur ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(`${resource} non trouvé(e)`, 404, true, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Erreur de conflit (ex: ressource déjà existante)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Erreur business logic
 */
export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 422, true, 'BUSINESS_ERROR');
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * Erreur serveur interne
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Erreur interne du serveur') {
    super(message, 500, false, 'INTERNAL_ERROR');
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Erreur de base de données
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Erreur de base de données') {
    super(message, 500, false, 'DATABASE_ERROR');
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// ==================== Logger ====================

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  [key: string]: unknown;
}

export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // En production, envoyer à un service de logging (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer service de logging externe
      console[level](JSON.stringify(logData));
    } else {
      // En développement, log formaté dans console
      console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, context || '');
    }
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.log(LogLevel.DEBUG, message, context);
    }
  }
}

// Export instance singleton
export const logger = Logger.getInstance();

// ==================== Error Handler ====================

/**
 * Détermine si une erreur est opérationnelle (attendue) ou critique
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Formatte l'erreur pour la réponse API
 */
export function formatErrorResponse(error: Error) {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      errors: error.errors,
    };
  }

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Erreur inconnue - ne pas exposer les détails en production
  if (process.env.NODE_ENV === 'production') {
    return {
      error: 'Une erreur est survenue',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  // En développement, montrer le message complet
  return {
    error: error.message,
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    stack: error.stack,
  };
}

/**
 * Handler global d'erreurs pour les routes API
 */
export function handleApiError(error: unknown, context?: LogContext): {
  error: string;
  code?: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  stack?: string;
} {
  const err = error instanceof Error ? error : new Error(String(error));

  // Log l'erreur
  logger.error(err.message, {
    ...context,
    stack: err.stack,
    isOperational: isOperationalError(err),
  });

  // Retourner la réponse formatée
  return formatErrorResponse(err);
}

/**
 * Wrapper pour routes API avec gestion d'erreurs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorResponse = handleApiError(error);
      return Response.json(errorResponse, {
        status: errorResponse.statusCode,
      });
    }
  }) as T;
}

// ==================== Helpers ====================

/**
 * Convertit les erreurs Zod en Record<string, string[]>
 */
export function formatZodErrors(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of issues) {
    const path = issue.path.map(p => String(p)).join('.');
    const key = path || 'general';

    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(issue.message);
  }

  return errors;
}

/**
 * Vérifie si une erreur Prisma est une violation de contrainte unique
 */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

/**
 * Vérifie si une erreur Prisma est une ressource non trouvée
 */
export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'P2025' || error.code === 'P2001')
  );
}

/**
 * Convertit une erreur Prisma en AppError
 */
export function handlePrismaError(error: unknown): AppError {
  if (isPrismaUniqueConstraintError(error)) {
    return new ConflictError('Cette ressource existe déjà');
  }

  if (isPrismaNotFoundError(error)) {
    return new NotFoundError('Ressource');
  }

  // Autres erreurs Prisma
  return new DatabaseError('Erreur de base de données');
}

/**
 * Wrapper async avec gestion d'erreurs
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Convertir erreurs Prisma
    if (isPrismaUniqueConstraintError(error) || isPrismaNotFoundError(error)) {
      throw handlePrismaError(error);
    }

    // Autres erreurs
    throw new InternalServerError(
      errorMessage || (error instanceof Error ? error.message : 'Une erreur est survenue')
    );
  }
}
