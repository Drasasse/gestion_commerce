import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET - Récupérer toutes les injections de capital
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'INJECTION_CAPITAL',
      },
      include: {
        boutique: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des injections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des injections' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle injection de capital
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const injectionSchema = z.object({
      boutiqueId: z.string().min(1, 'La boutique est requise'),
      montant: z.number().positive('Le montant doit être positif'),
      description: z.string().min(1, 'La description est requise'),
    });

    const validatedData = injectionSchema.parse(body);

    // Vérifier que la boutique existe
    const boutique = await prisma.boutique.findUnique({
      where: { id: validatedData.boutiqueId },
    });

    if (!boutique) {
      return NextResponse.json(
        { error: 'Boutique introuvable' },
        { status: 404 }
      );
    }

    // Créer la transaction d'injection de capital
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INJECTION_CAPITAL',
        montant: validatedData.montant,
        description: validatedData.description,
        boutiqueId: validatedData.boutiqueId,
        userId: session.user.id,
      },
      include: {
        boutique: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de l\'injection:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'injection' },
      { status: 500 }
    );
  }
}
