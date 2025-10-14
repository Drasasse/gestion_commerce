import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const stockUpdateSchema = z.object({
  quantite: z.number().min(0, 'La quantité doit être positive').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const stock = await prisma.stock.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        produit: {
          select: {
            id: true,
            nom: true,
            prixAchat: true,
            prixVente: true,
            categorie: {
              select: { nom: true }
            }
          }
        },
        mouvements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            quantite: true,
            motif: true,
            createdAt: true,
            vente: {
              select: {
                numeroVente: true,
              }
            }
          }
        }
      },
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que le stock existe et appartient à la boutique
    const existingStock = await prisma.stock.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: 'Stock non trouvé' },
        { status: 404 }
      );
    }

    try {
      const validatedData = stockUpdateSchema.parse(body);

      const stock = await prisma.stock.update({
        where: { id },
        data: validatedData,
        include: {
          produit: {
            select: {
              nom: true,
              prixAchat: true,
              prixVente: true,
              categorie: {
                select: { nom: true }
              }
            }
          }
        }
      });

      return NextResponse.json(stock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Données invalides', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier que le stock existe et appartient à la boutique
    const existingStock = await prisma.stock.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        mouvements: true,
      }
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: 'Stock non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des mouvements de stock
    if (existingStock.mouvements.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un stock avec des mouvements. Supprimez d\'abord les mouvements.' },
        { status: 400 }
      );
    }

    await prisma.stock.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Stock supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du stock:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}