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
      type BoutiqueWithStats = typeof boutiques[0] & {
        ventes?: Array<{ montantTotal: number; montantRestant: number }>;
        _count?: { users: number; produits: number; ventes: number; clients: number };
      };

      const boutiquesAvecStats = (boutiques as BoutiqueWithStats[]).map(boutique => {
        const ventes = boutique.ventes || [];
        const totalVentes = ventes.reduce((acc: number, v: any) => acc + v.montantTotal, 0);
        const totalImpayes = ventes.reduce((acc: number, v: any) => acc + v.montantRestant, 0);

        return {
          id: boutique.id,
          nom: boutique.nom,
          adresse: boutique.adresse,
          telephone: boutique.telephone,
          description: boutique.description,
          capitalInitial: boutique.capitalInitial,
          createdAt: boutique.createdAt,
          updatedAt: boutique.updatedAt,
          stats: {
            totalVentes,
            totalImpayes,
            nombreUsers: boutique._count?.users || 0,
            nombreProduits: boutique._count?.produits || 0,
            nombreVentes: boutique._count?.ventes || 0,
            nombreClients: boutique._count?.clients || 0,
          },
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
