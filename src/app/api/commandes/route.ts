import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withErrorHandler,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  formatZodErrors,
  logger
} from '@/lib/error-handler';

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

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthenticationError();
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
    throw new AuthenticationError('Boutique non spécifiée');
  }

  logger.info('Fetching orders', { userId: session.user.id, boutiqueId, statut });

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
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.boutiqueId) {
    throw new AuthenticationError('Boutique non spécifiée');
  }

  const body = await request.json();

  // Validate with Zod
  const result = commandeSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Données invalides', formatZodErrors(result.error.issues));
  }

  const validatedData = result.data;

  // Vérifier que le fournisseur existe et appartient à la boutique
  const fournisseur = await prisma.fournisseur.findFirst({
    where: {
      id: validatedData.fournisseurId,
      boutiqueId: session.user.boutiqueId,
    },
  });

  if (!fournisseur) {
    throw new NotFoundError('Fournisseur non trouvé');
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

  logger.info('Creating order', {
    userId: session.user.id,
    boutiqueId: session.user.boutiqueId,
    numeroCommande,
    fournisseurId: validatedData.fournisseurId
  });

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
});
