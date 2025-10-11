import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withErrorHandler,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  formatZodErrors,
  logger
} from '@/lib/error-handler';

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
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthenticationError();
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
    throw new AuthenticationError('Boutique non spécifiée');
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

  logger.info('Fetching products', { userId: session.user.id, boutiqueId, page });

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
});

// POST - Créer un nouveau produit
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.boutiqueId) {
    throw new AuthenticationError('Boutique non spécifiée');
  }

  const body = await request.json();

  // Validate with Zod
  const result = produitSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Données invalides', formatZodErrors(result.error.issues));
  }

  const validatedData = result.data;

  // Vérifier que la catégorie appartient à la boutique
  const categorie = await prisma.categorie.findFirst({
    where: {
      id: validatedData.categorieId,
      boutiqueId: session.user.boutiqueId,
    },
  });

  if (!categorie) {
    throw new NotFoundError('Catégorie non trouvée');
  }

  logger.info('Creating product', {
    userId: session.user.id,
    boutiqueId: session.user.boutiqueId,
    nom: validatedData.nom
  });

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
});