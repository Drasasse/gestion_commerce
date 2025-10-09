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
  venteId: z.string().optional(),
  dateTransaction: z.string().optional(),
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
    const where: any = {
      boutiqueId: session.user.boutiqueId,
    };

    if (type && ['RECETTE', 'DEPENSE'].includes(type)) {
      where.type = type;
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
          vente: {
            select: {
              numeroVente: true,
              client: {
                select: {
                  nom: true,
                  prenom: true,
                },
              },
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

    // Calcul des statistiques
    const stats = await prisma.transaction.groupBy({
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

    const recettesMois = stats.find(s => s.type === 'RECETTE')?._sum.montant || 0;
    const depensesMois = stats.find(s => s.type === 'DEPENSE')?._sum.montant || 0;
    const beneficeMois = recettesMois - depensesMois;

    // Calcul du solde total
    const soldeTotal = await prisma.transaction.aggregate({
      where: {
        boutiqueId: session.user.boutiqueId,
      },
      _sum: {
        montant: true,
      },
    });

    const recettesTotal = await prisma.transaction.aggregate({
      where: {
        boutiqueId: session.user.boutiqueId,
        type: 'RECETTE',
      },
      _sum: {
        montant: true,
      },
    });

    const depensesTotal = await prisma.transaction.aggregate({
      where: {
        boutiqueId: session.user.boutiqueId,
        type: 'DEPENSE',
      },
      _sum: {
        montant: true,
      },
    });

    const solde = (recettesTotal._sum.montant || 0) - (depensesTotal._sum.montant || 0);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
        categorie: validatedData.categorie,
        venteId: validatedData.venteId,
        dateTransaction: validatedData.dateTransaction 
          ? new Date(validatedData.dateTransaction)
          : new Date(),
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        vente: {
          select: {
            numeroVente: true,
            client: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
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