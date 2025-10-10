import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const utilisateurSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['ADMIN', 'GESTIONNAIRE']),
  boutiqueId: z.string().nullable().optional(),
});

// Schema for updates (unused for now, but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const utilisateurUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  email: z.string().email('Email invalide').optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
  role: z.enum(['ADMIN', 'GESTIONNAIRE']).optional(),
  boutiqueId: z.string().nullable().optional(),
});

// GET - Récupérer tous les utilisateurs (Admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const boutiqueId = searchParams.get('boutiqueId');

    const utilisateurs = await prisma.user.findMany({
      where: {
        ...(role && { role: role as 'ADMIN' | 'GESTIONNAIRE' }),
        ...(boutiqueId && { boutiqueId }),
      },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(utilisateurs);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur (Admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = utilisateurSchema.parse(body);

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Si gestionnaire, vérifier que la boutique existe
    if (validatedData.role === 'GESTIONNAIRE' && validatedData.boutiqueId) {
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

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        boutiqueId: validatedData.role === 'GESTIONNAIRE' ? validatedData.boutiqueId : null,
      },
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
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
