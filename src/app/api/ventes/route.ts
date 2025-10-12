import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, apiRateLimiter, sensitiveApiRateLimiter } from '@/lib/rate-limit';
import { cached, invalidateByTag, CachePrefix, CacheTTL, CacheTag } from '@/lib/cache';

const ligneVenteSchema = z.object({
  produitId: z.string(),
  quantite: z.number().min(1, 'La quantité doit être supérieure à 0'),
  prixUnitaire: z.number().min(0, 'Le prix unitaire doit être positif'),
});

const venteSchema = z.object({
  clientId: z.string().optional(),
  lignes: z.array(ligneVenteSchema).min(1, 'Au moins une ligne de vente est requise'),
  montantPaye: z.number().min(0, 'Le montant payé doit être positif').optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitCheck = await checkRateLimit(request, apiRateLimiter);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

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
    const statut = searchParams.get('statut');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
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

    interface VenteWhereConditions {
      boutiqueId: string;
      OR?: Array<{
        numeroVente?: { contains: string; mode: 'insensitive' };
        client?: { nom?: { contains: string; mode: 'insensitive' }; prenom?: { contains: string; mode: 'insensitive' } };
      }>;
      statut?: 'PAYE' | 'IMPAYE' | 'PARTIEL';
      dateVente?: { gte?: Date; lte?: Date };
    }

    const where: VenteWhereConditions = {
      boutiqueId: boutiqueId,
      ...(search && {
        OR: [
          { numeroVente: { contains: search, mode: 'insensitive' as const } },
          { client: { nom: { contains: search, mode: 'insensitive' as const } } },
          { client: { prenom: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
      ...(statut && { statut: statut as 'PAYE' | 'IMPAYE' | 'PARTIEL' }),
      ...(dateDebut && dateFin && {
        dateVente: {
          gte: new Date(dateDebut),
          lte: new Date(dateFin),
        },
      }),
    };

    const [ventes, total] = await Promise.all([
      prisma.vente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateVente: 'desc' },
        include: {
          client: true,
          user: {
            select: { name: true }
          },
          lignes: {
            include: {
              produit: {
                select: { nom: true }
              }
            }
          },
          _count: {
            select: { lignes: true }
          }
        }
      }),
      prisma.vente.count({ where }),
    ]);

    return NextResponse.json({
      ventes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.boutiqueId || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    try {
      const validatedData = venteSchema.parse(body);

      // Générer un numéro de vente unique
      const lastVente = await prisma.vente.findFirst({
        where: { boutiqueId: session.user.boutiqueId },
        orderBy: { createdAt: 'desc' },
        select: { numeroVente: true }
      });

      let numeroVente = 'V001';
      if (lastVente) {
        const lastNumber = parseInt(lastVente.numeroVente.substring(1));
        numeroVente = `V${(lastNumber + 1).toString().padStart(3, '0')}`;
      }

      // Vérifier la disponibilité des stocks et calculer le montant total
      let montantTotal = 0;
      const stockUpdates: Array<{
        stockId: string;
        produitId: string;
        quantite: number;
        nouvelleQuantite: number
      }> = [];

      for (const ligne of validatedData.lignes) {
        // Vérifier que le produit existe et appartient à la boutique
        const produit = await prisma.produit.findFirst({
          where: {
            id: ligne.produitId,
            boutiqueId: session.user.boutiqueId,
          },
          include: {
            stocks: {
              where: { boutiqueId: session.user.boutiqueId }
            }
          }
        });

        if (!produit) {
          return NextResponse.json(
            { error: `Produit non trouvé: ${ligne.produitId}` },
            { status: 400 }
          );
        }

        const stock = produit.stocks[0];
        if (!stock || stock.quantite < ligne.quantite) {
          return NextResponse.json(
            { 
              error: `Stock insuffisant pour ${produit.nom}. Disponible: ${stock?.quantite || 0}, Demandé: ${ligne.quantite}` 
            },
            { status: 400 }
          );
        }

        stockUpdates.push({
          stockId: stock.id,
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          nouvelleQuantite: stock.quantite - ligne.quantite
        });

        montantTotal += ligne.quantite * ligne.prixUnitaire;
      }

      const montantPaye = validatedData.montantPaye || montantTotal;
      const montantRestant = montantTotal - montantPaye;

      // Déterminer le statut de paiement
      let statut: 'PAYE' | 'IMPAYE' | 'PARTIEL' = 'PAYE';
      if (montantPaye === 0) {
        statut = 'IMPAYE';
      } else if (montantRestant > 0) {
        statut = 'PARTIEL';
      }

      // Créer la vente avec toutes les lignes et mouvements de stock
      const vente = await prisma.$transaction(async (tx: any) => {
        // Créer la vente
        const nouvelleVente = await tx.vente.create({
          data: {
            numeroVente,
            clientId: validatedData.clientId,
            boutiqueId: session.user.boutiqueId!,
            userId: session.user.id!,
            montantTotal,
            montantPaye,
            montantRestant,
            statut,
          },
        });

        // Créer les lignes de vente
        for (const ligne of validatedData.lignes) {
          await tx.ligneVente.create({
            data: {
              venteId: nouvelleVente.id,
              produitId: ligne.produitId,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              sousTotal: ligne.quantite * ligne.prixUnitaire,
            },
          });
        }

        // Mettre à jour les stocks et créer les mouvements
        for (const update of stockUpdates) {
          await tx.stock.update({
            where: { id: update.stockId },
            data: { 
              quantite: update.nouvelleQuantite,
              derniereSortie: new Date()
            },
          });

          await tx.mouvementStock.create({
            data: {
              stockId: update.stockId,
              type: 'SORTIE',
              quantite: update.quantite,
              motif: `Vente ${numeroVente}`,
              venteId: nouvelleVente.id,
            },
          });
        }

        return nouvelleVente;
      });

      // Récupérer la vente complète avec toutes les relations
      const venteComplete = await prisma.vente.findUnique({
        where: { id: vente.id },
        include: {
          client: true,
          user: {
            select: { name: true }
          },
          lignes: {
            include: {
              produit: {
                select: { nom: true }
              }
            }
          }
        }
      });

      return NextResponse.json(venteComplete, { status: 201 });
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
    console.error('Erreur lors de la création de la vente:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}