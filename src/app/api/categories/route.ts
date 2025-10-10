import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour les catégories
const categorieSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

// GET - Récupérer toutes les catégories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boutiqueIdParam = searchParams.get('boutiqueId');
    const includeCount = searchParams.get('includeCount') === 'true';

    // Admin can view any boutique, GESTIONNAIRE only their own
    let boutiqueId: string;
    if (session.user.role === 'ADMIN' && boutiqueIdParam) {
      boutiqueId = boutiqueIdParam;
    } else if (session.user.boutiqueId) {
      boutiqueId = session.user.boutiqueId;
    } else {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const categories = await prisma.categorie.findMany({
      where: {
        boutiqueId,
      },
      include: {
        ...(includeCount && {
          _count: {
            select: { produits: true },
          },
        }),
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = categorieSchema.parse(body);

    // Vérifier si une catégorie avec le même nom existe déjà
    const categorieExistante = await prisma.categorie.findFirst({
      where: {
        nom: validatedData.nom,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (categorieExistante) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    const categorie = await prisma.categorie.create({
      data: {
        ...validatedData,
        boutiqueId: session.user.boutiqueId,
      },
    });

    return NextResponse.json(categorie, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}