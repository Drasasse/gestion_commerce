import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withErrorHandler,
  AuthenticationError,
  ValidationError,
  formatZodErrors,
  logger
} from '@/lib/error-handler';

const fournisseurSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  entreprise: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user) {
    throw new AuthenticationError();
  }

  const { searchParams } = new URL(request.url);
  const boutiqueIdParam = searchParams.get('boutiqueId');
  const search = searchParams.get('search') || '';

  // Déterminer le boutiqueId à utiliser
  let boutiqueId: string | null = null;
  if (session.user.role === 'ADMIN' && boutiqueIdParam) {
    boutiqueId = boutiqueIdParam;
  } else if (session.user.boutiqueId) {
    boutiqueId = session.user.boutiqueId;
  }

  // Si pas de boutiqueId trouvé, retourner un tableau vide plutôt qu'une erreur
  if (!boutiqueId) {
    logger.warn('No boutiqueId found for user', { userId: session.user.id, role: session.user.role });
    return NextResponse.json([]);
  }

  logger.info('Fetching suppliers', { userId: session.user.id, boutiqueId });

  const fournisseurs = await prisma.fournisseur.findMany({
    where: {
      boutiqueId,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { entreprise: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { telephone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      _count: {
        select: {
          commandes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(fournisseurs);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.boutiqueId) {
    throw new AuthenticationError('Boutique non spécifiée');
  }

  const body = await request.json();

  // Validate with Zod
  const result = fournisseurSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Données invalides', formatZodErrors(result.error.issues));
  }

  const validatedData = result.data;

  logger.info('Creating supplier', {
    userId: session.user.id,
    boutiqueId: session.user.boutiqueId,
    nom: validatedData.nom
  });

  const fournisseur = await prisma.fournisseur.create({
    data: {
      ...validatedData,
      email: validatedData.email || null,
      boutiqueId: session.user.boutiqueId,
    },
    include: {
      _count: {
        select: {
          commandes: true,
        },
      },
    },
  });

  return NextResponse.json(fournisseur, { status: 201 });
});
