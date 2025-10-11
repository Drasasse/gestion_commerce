import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withErrorHandler,
  AuthenticationError,
  ConflictError,
  ValidationError,
  formatZodErrors,
  logger
} from '@/lib/error-handler';

// Schema de validation pour les catégories
const categorieSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

// GET - Récupérer toutes les catégories
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthenticationError();
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
    throw new AuthenticationError('Boutique non spécifiée');
  }

  logger.info('Fetching categories', { userId: session.user.id, boutiqueId });

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
});

// POST - Créer une nouvelle catégorie
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.boutiqueId) {
    throw new AuthenticationError('Boutique non spécifiée');
  }

  const body = await request.json();

  // Validate with Zod
  const result = categorieSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Données invalides', formatZodErrors(result.error.issues));
  }

  const validatedData = result.data;

  // Vérifier si une catégorie avec le même nom existe déjà
  const categorieExistante = await prisma.categorie.findFirst({
    where: {
      nom: validatedData.nom,
      boutiqueId: session.user.boutiqueId,
    },
  });

  if (categorieExistante) {
    throw new ConflictError('Une catégorie avec ce nom existe déjà');
  }

  logger.info('Creating category', {
    userId: session.user.id,
    boutiqueId: session.user.boutiqueId,
    nom: validatedData.nom
  });

  const categorie = await prisma.categorie.create({
    data: {
      ...validatedData,
      boutiqueId: session.user.boutiqueId,
    },
  });

  return NextResponse.json(categorie, { status: 201 });
});