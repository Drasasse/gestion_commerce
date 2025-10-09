import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const boutiqueSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  description: z.string().optional(),
  capitalInitial: z.number().min(0, 'Le capital initial doit être positif').optional(),
});

// GET - Récupérer toutes les boutiques (Admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    const boutiques = await prisma.boutique.findMany({
      orderBy: { createdAt: 'desc' },
      include: includeStats ? {
        _count: {
          select: {
            users: true,
            produits: true,
            ventes: true,
            clients: true,
          },
        },
        ventes: {
          select: {
            montantTotal: true,
            montantRestant: true,
          },
        },
      } : undefined,
    });

    // Si stats demandées, calculer les totaux
    if (includeStats) {
      const boutiquesAvecStats = boutiques.map(boutique => {
        const totalVentes = boutique.ventes?.reduce((acc, v) => acc + v.montantTotal, 0) || 0;
        const totalImpayes = boutique.ventes?.reduce((acc, v) => acc + v.montantRestant, 0) || 0;

        return {
          ...boutique,
          stats: {
            totalVentes,
            totalImpayes,
            nombreUsers: boutique._count?.users || 0,
            nombreProduits: boutique._count?.produits || 0,
            nombreVentes: boutique._count?.ventes || 0,
            nombreClients: boutique._count?.clients || 0,
          },
          ventes: undefined,
          _count: undefined,
        };
      });

      return NextResponse.json(boutiquesAvecStats);
    }

    return NextResponse.json(boutiques);
  } catch (error) {
    console.error('Erreur lors de la récupération des boutiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle boutique (Admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = boutiqueSchema.parse(body);

    const boutique = await prisma.boutique.create({
      data: validatedData,
    });

    return NextResponse.json(boutique, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de la boutique:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
