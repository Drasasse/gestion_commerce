import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const mouvementSchema = z.object({
  stockId: z.string().min(1, 'Le stock est requis'),
  type: z.enum(['ENTREE', 'SORTIE']),
  quantite: z.number().min(1, 'La quantité doit être positive'),
  motif: z.string().min(1, 'Le motif est requis'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const stockId = searchParams.get('stockId');
    const type = searchParams.get('type');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const skip = (page - 1) * limit;

    // Construire les conditions de recherche
    const whereConditions: {
      stock: { boutiqueId: string };
      stockId?: string;
      type?: 'ENTREE' | 'SORTIE';
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      stock: {
        boutiqueId: session.user.boutiqueId,
      },
    };

    if (stockId) {
      whereConditions.stockId = stockId;
    }

    if (type && (type === 'ENTREE' || type === 'SORTIE')) {
      whereConditions.type = type as 'ENTREE' | 'SORTIE';
    }

    if (dateDebut || dateFin) {
      whereConditions.createdAt = {};
      if (dateDebut) {
        whereConditions.createdAt.gte = new Date(dateDebut);
      }
      if (dateFin) {
        whereConditions.createdAt.lte = new Date(dateFin);
      }
    }

    const [mouvements, total] = await Promise.all([
      prisma.mouvementStock.findMany({
        where: whereConditions,
        include: {
          stock: {
            include: {
              produit: {
                select: {
                  nom: true,
                  categorie: {
                    select: { nom: true }
                  }
                }
              }
            }
          },
          vente: {
            select: {
              numeroVente: true,
              client: {
                select: { nom: true, prenom: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mouvementStock.count({ where: whereConditions }),
    ]);

    return NextResponse.json({
      mouvements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements:', error);
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
      const validatedData = mouvementSchema.parse(body);

      // Vérifier que le stock existe et appartient à la boutique
      const stock = await prisma.stock.findFirst({
        where: {
          id: validatedData.stockId,
          boutiqueId: session.user.boutiqueId,
        },
        include: {
          produit: {
            select: { nom: true }
          }
        }
      });

      if (!stock) {
        return NextResponse.json(
          { error: 'Stock non trouvé' },
          { status: 404 }
        );
      }

      // Vérifier la disponibilité pour les sorties
      if (validatedData.type === 'SORTIE' && stock.quantite < validatedData.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant. Quantité disponible: ${stock.quantite}` },
          { status: 400 }
        );
      }

      // Créer le mouvement et mettre à jour le stock dans une transaction
      const result = await prisma.$transaction(async (tx) => {
        // Créer le mouvement
        const mouvement = await tx.mouvementStock.create({
          data: validatedData,
          include: {
            stock: {
              include: {
                produit: {
                  select: { nom: true }
                }
              }
            }
          }
        });

        // Mettre à jour la quantité du stock
        const nouvelleQuantite = validatedData.type === 'ENTREE' 
          ? stock.quantite + validatedData.quantite
          : stock.quantite - validatedData.quantite;

        await tx.stock.update({
          where: { id: validatedData.stockId },
          data: { quantite: nouvelleQuantite },
        });

        return mouvement;
      });

      return NextResponse.json(result, { status: 201 });
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
    console.error('Erreur lors de la création du mouvement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}