import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour les produits
const produitSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  prixAchat: z.number().positive('Le prix d\'achat doit être positif'),
  prixVente: z.number().positive('Le prix de vente doit être positif'),
  seuilAlerte: z.number().int().min(0, 'Le seuil d\'alerte doit être positif'),
  categorieId: z.string().min(1, 'La catégorie est requise'),
});

// GET - Récupérer tous les produits
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categorieId = searchParams.get('categorieId') || '';

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

    const skip = (page - 1) * limit;

    const where = {
      boutiqueId,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categorieId && { categorieId }),
    };

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        include: {
          categorie: true,
          stocks: {
            where: { boutiqueId },
            select: { quantite: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.produit.count({ where }),
    ]);

    // Ajouter la quantité en stock à chaque produit
    const produitsAvecStock = produits.map(produit => ({
      ...produit,
      quantiteStock: produit.stocks[0]?.quantite || 0,
      stocks: undefined,
    }));

    return NextResponse.json({
      produits: produitsAvecStock,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau produit
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
    const validatedData = produitSchema.parse(body);

    // Vérifier que la catégorie appartient à la boutique
    const categorie = await prisma.categorie.findFirst({
      where: {
        id: validatedData.categorieId,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!categorie) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    // Créer le produit et son stock initial
    const produit = await prisma.$transaction(async (tx) => {
      const nouveauProduit = await tx.produit.create({
        data: {
          ...validatedData,
          boutiqueId: session.user.boutiqueId!,
        },
        include: {
          categorie: true,
        },
      });

      // Créer le stock initial
      await tx.stock.create({
        data: {
          produitId: nouveauProduit.id,
          boutiqueId: session.user.boutiqueId!,
          quantite: 0,
        },
      });

      return nouveauProduit;
    });

    return NextResponse.json(produit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}