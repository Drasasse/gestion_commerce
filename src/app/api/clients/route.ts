import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const clientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);


    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boutiqueIdParam = searchParams.get('boutiqueId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Admin can view any boutique, GESTIONNAIRE only their own
    let boutiqueId: string;
    if (session.user.role === 'ADMIN' && boutiqueIdParam) {
      boutiqueId = boutiqueIdParam;
    } else if (session.user.boutiqueId) {
      boutiqueId = session.user.boutiqueId;
    } else {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const where = {
      boutiqueId,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' as const } },
          { prenom: { contains: search, mode: 'insensitive' as const } },
          { telephone: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { ventes: true }
          }
        }
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    try {
      const validatedData = clientSchema.parse(body);

      // Vérifier l'unicité de l'email s'il est fourni
      if (validatedData.email) {
        const existingClient = await prisma.client.findFirst({
          where: {
            email: validatedData.email,
            boutiqueId: session.user.boutiqueId,
          },
        });

        if (existingClient) {
          return NextResponse.json(
            { error: 'Un client avec cet email existe déjà' },
            { status: 400 }
          );
        }
      }

      const client = await prisma.client.create({
        data: {
          ...validatedData,
          boutiqueId: session.user.boutiqueId!,
        },
        include: {
          _count: {
            select: { ventes: true }
          }
        }
      });

      return NextResponse.json(client, { status: 201 });
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
    console.error('Erreur lors de la création du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}