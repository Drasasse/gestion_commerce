import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour la mise à jour des transactions
const transactionUpdateSchema = z.object({
  type: z.enum(['RECETTE', 'DEPENSE']).optional(),
  montant: z.number().positive('Le montant doit être positif').optional(),
  description: z.string().min(1, 'La description est requise').optional(),
  categorie: z.string().min(1, 'La catégorie est requise').optional(),
  dateTransaction: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        boutique: {
          select: {
            nom: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
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
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = transactionUpdateSchema.parse(body);

    // Vérifier que la transaction existe et appartient à la boutique
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }



    // Préparer les données de mise à jour
    const updateData: {
      type?: 'VENTE' | 'ACHAT' | 'DEPENSE' | 'INJECTION_CAPITAL' | 'RETRAIT' | 'RECETTE';
      montant?: number;
      description?: string;
      dateTransaction?: Date;
    } = {};

    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }

    if (validatedData.montant !== undefined) {
      // Ajuster le montant selon le type
      const type = validatedData.type || existingTransaction.type;
      updateData.montant = type === 'DEPENSE' 
        ? -Math.abs(validatedData.montant)
        : Math.abs(validatedData.montant);
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }



    if (validatedData.dateTransaction !== undefined) {
      updateData.dateTransaction = new Date(validatedData.dateTransaction);
    }

    const transaction = await prisma.transaction.update({
      where: { id: id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        boutique: {
          select: {
            nom: true,
          },
        },
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de la transaction:', error);
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
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la transaction existe et appartient à la boutique
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }



    await prisma.transaction.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la transaction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}