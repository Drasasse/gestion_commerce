import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ligneCommandeSchema = z.object({
  produitId: z.string(),
  quantite: z.number().min(1, 'La quantité doit être supérieure à 0'),
  prixUnitaire: z.number().min(0, 'Le prix unitaire doit être positif'),
});

const commandeSchema = z.object({
  fournisseurId: z.string().min(1, 'Le fournisseur est requis'),
  lignes: z.array(ligneCommandeSchema).min(1, 'Au moins une ligne de commande est requise'),
  dateEcheance: z.string().optional(),
  notes: z.string().optional(),
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
    const statut = searchParams.get('statut');
    const fournisseurId = searchParams.get('fournisseurId');

    // Déterminer le boutiqueId à utiliser
    let boutiqueId: string;
    if (session.user.role === 'ADMIN' && boutiqueIdParam) {
      boutiqueId = boutiqueIdParam;
    } else if (session.user.boutiqueId) {
      boutiqueId = session.user.boutiqueId;
    } else {
      return NextResponse.json(
        { error: 'Boutique non spécifiée' },
        { status: 400 }
      );
    }

    const commandes = await prisma.commande.findMany({
      where: {
        boutiqueId,
        ...(statut && { statut: statut as 'EN_ATTENTE' | 'EN_COURS' | 'RECUE' | 'ANNULEE' }),
        ...(fournisseurId && { fournisseurId }),
      },
      include: {
        fournisseur: true,
        lignes: {
          include: {
            produit: true,
          },
        },
        _count: {
          select: {
            lignes: true,
          },
        },
      },
      orderBy: {
        dateCommande: 'desc',
      },
    });

    return NextResponse.json(commandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
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
    const validatedData = commandeSchema.parse(body);

    // Vérifier que le fournisseur existe et appartient à la boutique
    const fournisseur = await prisma.fournisseur.findFirst({
      where: {
        id: validatedData.fournisseurId,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!fournisseur) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      );
    }

    // Calculer le montant total
    const montantTotal = validatedData.lignes.reduce(
      (sum, ligne) => sum + ligne.quantite * ligne.prixUnitaire,
      0
    );

    // Générer le numéro de commande
    const lastCommande = await prisma.commande.findFirst({
      where: { boutiqueId: session.user.boutiqueId },
      orderBy: { createdAt: 'desc' },
    });

    const lastNumber = lastCommande?.numeroCommande.match(/\d+$/)?.[0] || '0';
    const numeroCommande = `CMD-${String(parseInt(lastNumber) + 1).padStart(6, '0')}`;

    // Créer la commande avec les lignes
    const commande = await prisma.commande.create({
      data: {
        numeroCommande,
        fournisseurId: validatedData.fournisseurId,
        boutiqueId: session.user.boutiqueId,
        montantTotal,
        montantRestant: montantTotal,
        dateEcheance: validatedData.dateEcheance ? new Date(validatedData.dateEcheance) : null,
        notes: validatedData.notes,
        lignes: {
          create: validatedData.lignes.map((ligne) => ({
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            sousTotal: ligne.quantite * ligne.prixUnitaire,
          })),
        },
      },
      include: {
        fournisseur: true,
        lignes: {
          include: {
            produit: true,
          },
        },
      },
    });

    return NextResponse.json(commande, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
