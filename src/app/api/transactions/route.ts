import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour les transactions
const transactionSchema = z.object({
  type: z.enum(['RECETTE', 'DEPENSE']),
  montant: z.number().positive('Le montant doit être positif'),
  description: z.string().min(1, 'La description est requise'),
  categorie: z.string().min(1, 'La catégorie est requise'),
  categorieDepense: z.enum(['MARCHANDISES', 'EXPLOITATION', 'MARKETING', 'TRANSPORT', 'ADMINISTRATION', 'AUTRE']).optional(),
  venteId: z.string().optional(),
  dateTransaction: z.string().optional(),
}).refine((data) => {
  // Si c'est une dépense, la catégorie de dépense est requise
  if (data.type === 'DEPENSE' && !data.categorieDepense) {
    return false;
  }
  return true;
}, {
  message: "La catégorie de dépense est requise pour les dépenses",
  path: ["categorieDepense"],
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const categorie = searchParams.get('categorie');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Construction des filtres
    interface WhereConditions {
      boutiqueId: string;
      type?: 'VENTE' | 'ACHAT' | 'DEPENSE' | 'INJECTION_CAPITAL' | 'RETRAIT' | 'RECETTE';
      categorie?: { contains: string; mode: 'insensitive' };
      dateTransaction?: { gte?: Date; lte?: Date };
      description?: { contains: string; mode: 'insensitive' };
    }

    const where: WhereConditions = {
      boutiqueId: session.user.boutiqueId,
    };

    if (type && ['RECETTE', 'DEPENSE'].includes(type)) {
      where.type = type as 'RECETTE' | 'DEPENSE';
    }

    if (categorie) {
      where.categorie = {
        contains: categorie,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (dateDebut || dateFin) {
      where.dateTransaction = {};
      if (dateDebut) {
        where.dateTransaction.gte = new Date(dateDebut);
      }
      if (dateFin) {
        where.dateTransaction.lte = new Date(dateFin + 'T23:59:59.999Z');
      }
    }

    // Récupération des transactions avec pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
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
        orderBy: {
          dateTransaction: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calcul des statistiques du mois en cours
    const statsMonth = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        boutiqueId: session.user.boutiqueId,
        dateTransaction: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        montant: true,
      },
    });

    // Calcul du solde total (toutes les transactions depuis le début)
    const statsTotal = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        boutiqueId: session.user.boutiqueId,
      },
      _sum: {
        montant: true,
      },
    });

    const recettesMois = statsMonth.find((s: any) => s.type === 'RECETTE')?._sum.montant || 0;
    const depensesMois = Math.abs(statsMonth.find((s: any) => s.type === 'DEPENSE')?._sum.montant || 0);
    const beneficeMois = recettesMois - depensesMois;

    // Calcul du solde total (capital + injections + recettes - dépenses)
    const recettesTotal = statsTotal.find((s: any) => s.type === 'RECETTE')?._sum.montant || 0;
    const depensesTotal = Math.abs(statsTotal.find((s: any) => s.type === 'DEPENSE')?._sum.montant || 0);
    const injectionsTotal = statsTotal.find((s: any) => s.type === 'INJECTION_CAPITAL')?._sum.montant || 0;
    
    // Récupérer le capital initial de la boutique
    const boutique = await prisma.boutique.findUnique({
      where: { id: session.user.boutiqueId },
      select: { capitalInitial: true }
    });
    
    const capitalInitial = boutique?.capitalInitial || 0;
    const solde = capitalInitial + injectionsTotal + recettesTotal - depensesTotal;

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        recettesMois,
        depensesMois,
        beneficeMois,
        solde,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
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
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    // Vérification de la vente si venteId est fourni
    if (validatedData.venteId) {
      const vente = await prisma.vente.findFirst({
        where: {
          id: validatedData.venteId,
          boutiqueId: session.user.boutiqueId,
        },
      });

      if (!vente) {
        return NextResponse.json(
          { error: 'Vente non trouvée' },
          { status: 404 }
        );
      }
    }

    // Ajustement du montant selon le type
    const montantAjuste = validatedData.type === 'DEPENSE'
      ? -Math.abs(validatedData.montant)
      : Math.abs(validatedData.montant);

    const transaction = await prisma.transaction.create({
      data: {
        type: validatedData.type,
        montant: montantAjuste,
        description: validatedData.description,
        categorieDepense: validatedData.categorieDepense,
        dateTransaction: validatedData.dateTransaction
          ? new Date(validatedData.dateTransaction)
          : new Date(),
        boutiqueId: session.user.boutiqueId,
        userId: session.user.id,
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

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de la transaction:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
