import { NextResponse } from 'next/server';

/**
 * Endpoint de vérification de l'état de santé de l'API
 * GET /api/health
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected' // On pourrait ajouter une vraie vérification DB ici
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}