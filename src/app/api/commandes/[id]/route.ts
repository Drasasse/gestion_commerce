import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCommandeSchema = z.object({
  statut: z.enum(['EN_ATTENTE', 'EN_COURS', 'RECUE', 'ANNULEE']).optional(),
  dateReception: z.string().optional(),
  notes: z.string().optional(),
  montantPaye: z.number().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const commande = await prisma.commande.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        fournisseur: true,
        lignes: {
          include: {
            produit: {
              include: {
                categorie: true,
              },
            },
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(commande);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCommandeSchema.parse(body);

    const commande = await prisma.commande.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!commande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    const updateData: {
      statut?: 'EN_ATTENTE' | 'EN_COURS' | 'RECUE' | 'ANNULEE';
      dateReception?: Date;
      notes?: string;
      montantPaye?: number;
      montantRestant?: number;
    } = {};

    if (validatedData.statut) {
      updateData.statut = validatedData.statut;
    }

    if (validatedData.dateReception) {
      updateData.dateReception = new Date(validatedData.dateReception);
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.montantPaye !== undefined) {
      updateData.montantPaye = validatedData.montantPaye;
      updateData.montantRestant = commande.montantTotal - validatedData.montantPaye;
    }

    const updated = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: {
        fournisseur: true,
        lignes: {
          include: {
            produit: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const commande = await prisma.commande.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!commande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    if (commande.statut === 'RECUE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une commande reçue' },
        { status: 400 }
      );
    }

    await prisma.commande.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
