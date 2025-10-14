import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, apiRateLimiter, sensitiveApiRateLimiter } from '@/lib/rate-limit';

const stockSchema = z.object({
  produitId: z.string().min(1, 'Le produit est requis'),
  quantite: z.number().min(0, 'La quantité doit être positive'),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitCheck = await checkRateLimit(request, apiRateLimiter);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boutiqueIdParam = searchParams.get('boutiqueId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const alerteOnly = searchParams.get('alerte') === 'true';

    const skip = (page - 1) * limit;

    // Déterminer le boutiqueId à utiliser
    let boutiqueId: string;
    if (session.user.role === 'ADMIN' && boutiqueIdParam) {
      // Admin peut spécifier une boutique
      boutiqueId = boutiqueIdParam;
    } else if (session.user.boutiqueId) {
      // Gestionnaire utilise sa boutique
      boutiqueId = session.user.boutiqueId;
    } else {
      return NextResponse.json(
        { error: 'Boutique non spécifiée' },
        { status: 400 }
      );
    }

    // Construire les conditions de recherche
    const whereConditions: {
      boutiqueId: string;
      produit?: { nom: { contains: string; mode: 'insensitive' } };
    } = {
      boutiqueId: boutiqueId,
    };

    if (search) {
      whereConditions.produit = {
        nom: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    // Note: alerteOnly filter will be applied after fetching data

    const [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where: whereConditions,
        include: {
          produit: {
            select: {
              id: true,
              nom: true,
              prixAchat: true,
              prixVente: true,
              seuilAlerte: true,
              categorie: {
                select: { nom: true }
              }
            }
          },
          mouvements: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              quantite: true,
              motif: true,
              createdAt: true,
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stock.count({ where: whereConditions }),
    ]);

    // Filter stocks for alerts if needed
    let filteredStocks = stocks;
    if (alerteOnly) {
      filteredStocks = stocks.filter((stock: any) => 
        stock.produit.seuilAlerte && stock.quantite <= stock.produit.seuilAlerte
      );
    }

    // Calculate stocks in alert
    const stocksEnAlerte = stocks.filter((stock: any) => 
      stock.produit.seuilAlerte && stock.quantite <= stock.produit.seuilAlerte
    ).length;

    return NextResponse.json({
      stocks: filteredStocks,
      pagination: {
        page,
        limit,
        total: alerteOnly ? filteredStocks.length : total,
        pages: Math.ceil((alerteOnly ? filteredStocks.length : total) / limit),
      },
      stocksEnAlerte,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stocks:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();

    try {
      const validatedData = stockSchema.parse(body);

      // Vérifier que le produit existe et appartient à la boutique
      const produit = await prisma.produit.findFirst({
        where: {
          id: validatedData.produitId,
          boutiqueId: session.user.boutiqueId,
        },
      });

      if (!produit) {
        return NextResponse.json(
          { error: 'Produit non trouvé' },
          { status: 404 }
        );
      }

      // Vérifier qu'il n'y a pas déjà un stock pour ce produit
      const existingStock = await prisma.stock.findFirst({
        where: {
          produitId: validatedData.produitId,
          boutiqueId: session.user.boutiqueId,
        },
      });

      if (existingStock) {
        return NextResponse.json(
          { error: 'Un stock existe déjà pour ce produit' },
          { status: 400 }
        );
      }

      const stock = await prisma.stock.create({
        data: {
          ...validatedData,
          boutiqueId: session.user.boutiqueId,
        },
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

      // Créer un mouvement d'entrée initial si la quantité > 0
      if (validatedData.quantite > 0) {
        await prisma.mouvementStock.create({
          data: {
            stockId: stock.id,
            type: 'ENTREE',
            quantite: validatedData.quantite,
            motif: 'Stock initial',
          },
        });
      }

      return NextResponse.json(stock, { status: 201 });
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
    console.error('Erreur lors de la création du stock:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
