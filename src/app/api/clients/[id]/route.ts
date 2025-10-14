import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const clientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
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

    const client = await prisma.client.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        _count: {
          select: { ventes: true }
        },
        ventes: {
          take: 5,
          orderBy: { dateVente: 'desc' },
          select: {
            id: true,
            numeroVente: true,
            montantTotal: true,
            statut: true,
            dateVente: true,
          }
        }
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
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

    // Vérifier que le client existe et appartient à la boutique
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    try {
      const validatedData = clientSchema.parse(body);

      // Vérifier l'unicité de l'email s'il est fourni et différent de l'actuel
      if (validatedData.email && validatedData.email !== existingClient.email) {
        const emailExists = await prisma.client.findFirst({
          where: {
            email: validatedData.email,
            boutiqueId: session.user.boutiqueId,
            id: { not: id },
          },
        });

        if (emailExists) {
          return NextResponse.json(
            { error: 'Un client avec cet email existe déjà' },
            { status: 400 }
          );
        }
      }

      const client = await prisma.client.update({
        where: { id },
        data: validatedData,
        include: {
          _count: {
            select: { ventes: true }
          }
        }
      });

      return NextResponse.json(client);
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
    console.error('Erreur lors de la mise à jour du client:', error);
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

    // Vérifier que le client existe et appartient à la boutique
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        _count: {
          select: { ventes: true }
        }
      }
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des ventes associées
    if (existingClient._count.ventes > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce client car il a des ventes associées',
          details: `${existingClient._count.ventes} vente(s) associée(s)`
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Client supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}