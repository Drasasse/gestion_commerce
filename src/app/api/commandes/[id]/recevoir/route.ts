import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, sensitiveApiRateLimiter } from '@/lib/rate-limit';
import { invalidateByTag } from '@/lib/cache';

// Interfaces TypeScript
interface LigneCommande {
  id: string;
  produitId: string;
  quantite: number;
  quantiteRecue: number;
  prixUnitaire: number;
}

interface Commande {
  id: string;
  statut: string;
  lignes: LigneCommande[];
}

const recevoirCommandeSchema = z.object({
  lignesRecues: z.array(
    z.object({
      ligneId: z.string(),
      quantiteRecue: z.number().min(0),
    })
  ),
  montantPaye: z.number().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = recevoirCommandeSchema.parse(body);

    // Récupérer la commande
    const commande = await prisma.commande.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
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

    if (!commande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    if (commande.statut === 'RECUE') {
      return NextResponse.json(
        { error: 'Cette commande a déjà été reçue' },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx: any) => {
      // Mettre à jour les lignes de commande et les stocks
       for (const ligneRecue of validatedData.lignesRecues) {
         const ligne = commande.lignes.find(l => l.id === ligneRecue.ligneId);

        if (!ligne) {
          throw new Error(`Ligne de commande ${ligneRecue.ligneId} non trouvée`);
        }

        // Mettre à jour la ligne de commande
        await tx.ligneCommande.update({
          where: { id: ligneRecue.ligneId },
          data: {
            quantiteRecue: ligneRecue.quantiteRecue,
          },
        });

        // Mettre à jour le stock
        if (ligneRecue.quantiteRecue > 0) {
          const stock = await tx.stock.findFirst({
            where: {
              produitId: ligne.produitId,
              boutiqueId: session.user.boutiqueId!,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantite: {
                  increment: ligneRecue.quantiteRecue,
                },
                derniereEntree: new Date(),
              },
            });
          } else {
            await tx.stock.create({
              data: {
                produitId: ligne.produitId,
                boutiqueId: session.user.boutiqueId!,
                quantite: ligneRecue.quantiteRecue,
                derniereEntree: new Date(),
              },
            });
          }

          // Créer un mouvement de stock
          await tx.mouvementStock.create({
            data: {
              stockId: stock ? stock.id : (await tx.stock.findFirst({
                where: {
                  produitId: ligne.produitId,
                  boutiqueId: session.user.boutiqueId!,
                },
              }))!.id,
              type: 'ENTREE',
              quantite: ligneRecue.quantiteRecue,
              motif: `Réception commande ${commande.numeroCommande}`,
            },
          });
        }
      }

      // Vérifier si toutes les lignes sont complètement reçues
       const toutesLignesRecues = validatedData.lignesRecues.every(
         (lr) => {
           const ligne = commande.lignes.find(l => l.id === lr.ligneId);
           return ligne && lr.quantiteRecue >= ligne.quantite;
         }
       );

      // Créer une transaction de dépense si un montant est payé
      if (validatedData.montantPaye !== undefined && validatedData.montantPaye > 0) {
        await tx.transaction.create({
          data: {
            boutiqueId: session.user.boutiqueId!,
            userId: session.user.id,
            type: 'DEPENSE',
            montant: validatedData.montantPaye,
            description: `Paiement commande ${commande.numeroCommande} - ${commande.fournisseur.nom}`,
            dateTransaction: new Date(),
          },
        });
      }

      // Mettre à jour la commande
      const updatedCommande = await tx.commande.update({
        where: { id },
        data: {
          statut: toutesLignesRecues ? 'RECUE' : 'EN_COURS',
          dateReception: toutesLignesRecues ? new Date() : null,
          ...(validatedData.montantPaye !== undefined && {
            montantPaye: validatedData.montantPaye,
            montantRestant: commande.montantTotal - validatedData.montantPaye,
          }),
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

      return updatedCommande;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erreur de validation Zod:', error.issues);
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la réception de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
