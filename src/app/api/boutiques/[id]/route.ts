import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const boutiqueSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  description: z.string().optional(),
  capitalInitial: z.number().min(0, 'Le capital initial doit être positif').optional(),
});

// GET - Récupérer une boutique par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const boutique = await prisma.boutique.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            produits: true,
            ventes: true,
            clients: true,
          },
        },
      },
    });

    if (!boutique) {
      return NextResponse.json(
        { error: 'Boutique non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(boutique);
  } catch (error) {
    console.error('Erreur lors de la récupération de la boutique:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une boutique
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = boutiqueSchema.parse(body);

    const boutique = await prisma.boutique.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(boutique);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de la boutique:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une boutique
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Vérifier qu'il n'y a pas d'utilisateurs assignés
    const users = await prisma.user.count({
      where: { boutiqueId: params.id },
    });

    if (users > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une boutique avec des utilisateurs assignés' },
        { status: 400 }
      );
    }

    await prisma.boutique.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la boutique:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
