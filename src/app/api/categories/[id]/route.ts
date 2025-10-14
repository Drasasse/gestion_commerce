import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  handleApiError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessError,
  formatZodErrors,
  logger
} from '@/lib/error-handler';

const updateCategorieSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.boutiqueId) {
      throw new AuthenticationError('Boutique non spécifiée');
    }

    const { id } = await context.params;

    const categorie = await prisma.categorie.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        _count: {
          select: {
            produits: true,
          },
        },
      },
    });

    if (!categorie) {
      throw new NotFoundError('Catégorie non trouvée');
    }

    return NextResponse.json(categorie);
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.boutiqueId) {
      throw new AuthenticationError('Boutique non spécifiée');
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validation des données
    const result = updateCategorieSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Données invalides', formatZodErrors(result.error.issues));
    }

    const validatedData = result.data;

    // Vérifier que la catégorie existe et appartient à la boutique
    const existingCategorie = await prisma.categorie.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingCategorie) {
      throw new NotFoundError('Catégorie non trouvée');
    }

    // Vérifier l'unicité du nom (sauf pour la catégorie actuelle)
    const duplicateCategorie = await prisma.categorie.findFirst({
      where: {
        nom: validatedData.nom,
        boutiqueId: session.user.boutiqueId,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCategorie) {
      throw new ConflictError('Une catégorie avec ce nom existe déjà');
    }

    logger.info('Updating category', { userId: session.user.id, categoryId: id });

    // Mettre à jour la catégorie
    const updatedCategorie = await prisma.categorie.update({
      where: { id },
      data: {
        nom: validatedData.nom,
        description: validatedData.description,
      },
      include: {
        _count: {
          select: {
            produits: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategorie);
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.boutiqueId) {
      throw new AuthenticationError('Boutique non spécifiée');
    }

    const { id } = await context.params;

    // Vérifier que la catégorie existe et appartient à la boutique
    const existingCategorie = await prisma.categorie.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        _count: {
          select: {
            produits: true,
          },
        },
      },
    });

    if (!existingCategorie) {
      throw new NotFoundError('Catégorie non trouvée');
    }

    // Vérifier qu'aucun produit n'utilise cette catégorie
    if (existingCategorie._count.produits > 0) {
      throw new BusinessError(
        `Impossible de supprimer cette catégorie car elle contient ${existingCategorie._count.produits} produit(s)`
      );
    }

    logger.info('Deleting category', { userId: session.user.id, categoryId: id });

    // Supprimer la catégorie
    await prisma.categorie.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}