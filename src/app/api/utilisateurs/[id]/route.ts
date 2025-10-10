import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const utilisateurUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  email: z.string().email('Email invalide').optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
  role: z.enum(['ADMIN', 'GESTIONNAIRE']).optional(),
  boutiqueId: z.string().nullable().optional(),
});

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        boutiqueId: true,
        boutique: {
          select: {
            id: true,
            nom: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = utilisateurUpdateSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Si email modifié, vérifier qu'il n'est pas déjà utilisé
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: {
      name?: string;
      email?: string;
      role?: 'ADMIN' | 'GESTIONNAIRE';
      password?: string;
      boutiqueId?: string | null;
    } = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.email && { email: validatedData.email }),
      ...(validatedData.role && { role: validatedData.role }),
    };

    // Si mot de passe fourni, le hasher
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Gérer l'assignation de boutique
    if ('boutiqueId' in validatedData) {
      if (validatedData.boutiqueId) {
        // Vérifier que la boutique existe
        const boutique = await prisma.boutique.findUnique({
          where: { id: validatedData.boutiqueId },
        });

        if (!boutique) {
          return NextResponse.json(
            { error: 'Boutique non trouvée' },
            { status: 404 }
          );
        }
      }
      updateData.boutiqueId = validatedData.boutiqueId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        boutiqueId: true,
        boutique: {
          select: {
            id: true,
            nom: true,
          },
        },
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Empêcher de se supprimer soi-même
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'a pas de ventes ou transactions
    const [ventes, transactions] = await Promise.all([
      prisma.vente.count({ where: { userId: id } }),
      prisma.transaction.count({ where: { userId: id } }),
    ]);

    if (ventes > 0 || transactions > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un utilisateur avec des ventes ou transactions' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
