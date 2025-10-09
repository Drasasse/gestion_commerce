import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCategorieSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validation des données
    const validatedData = updateCategorieSchema.parse(body);

    // Vérifier que la catégorie existe et appartient à la boutique
    const existingCategorie = await prisma.categorie.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingCategorie) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
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
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 });
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    // Vérifier qu'aucun produit n'utilise cette catégorie
    if (existingCategorie._count.produits > 0) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer cette catégorie car elle contient ${existingCategorie._count.produits} produit(s)` 
        },
        { status: 400 }
      );
    }

    // Supprimer la catégorie
    await prisma.categorie.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}