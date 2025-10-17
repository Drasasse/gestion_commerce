import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const receptionPartielleSchema = z.object({
  lignes: z.array(z.object({
    ligneCommandeId: z.string(),
    quantiteRecue: z.number().min(0, 'La quantité reçue doit être positive'),
  })),
  montantPaye: z.number().min(0, 'Le montant payé doit être positif').optional(),
  notes: z.string().optional(),
  annulerReste: z.boolean().optional().default(false), // Pour annuler le reste non reçu
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    try {
      const validatedData = receptionPartielleSchema.parse(body);

      // Vérifier que la commande existe et appartient à la boutique
      const commande = await prisma.commande.findFirst({
        where: {
          id,
          boutiqueId: session.user.boutiqueId,
        },
        include: {
          lignes: {
            include: {
              produit: {
                include: {
                  stocks: {
                    where: { boutiqueId: session.user.boutiqueId }
                  }
                }
              }
            }
          }
        }
      });

      if (!commande) {
        return NextResponse.json(
          { error: 'Commande non trouvée' },
          { status: 404 }
        );
      }

      if (commande.statut === 'RECUE' || commande.statut === 'ANNULEE') {
        return NextResponse.json(
          { error: 'Cette commande a déjà été traitée' },
          { status: 400 }
        );
      }

      // Traiter la réception partielle dans une transaction
      const result = await prisma.$transaction(async (tx: any) => {
        let montantTotalRecu = 0;
        let toutesLignesRecues = true;

        // Traiter chaque ligne de réception
        for (const ligneReception of validatedData.lignes) {
          const ligneCommande = commande.lignes.find(l => l.id === ligneReception.ligneCommandeId);
          
          if (!ligneCommande) {
            throw new Error(`Ligne de commande ${ligneReception.ligneCommandeId} non trouvée`);
          }

          // Vérifier que la quantité reçue ne dépasse pas la quantité commandée
          const nouvelleQuantiteRecue = ligneCommande.quantiteRecue + ligneReception.quantiteRecue;
          if (nouvelleQuantiteRecue > ligneCommande.quantite) {
            throw new Error(`Quantité reçue (${nouvelleQuantiteRecue}) dépasse la quantité commandée (${ligneCommande.quantite}) pour le produit ${ligneCommande.produit.nom}`);
          }

          // Mettre à jour la ligne de commande
          await tx.ligneCommande.update({
            where: { id: ligneReception.ligneCommandeId },
            data: {
              quantiteRecue: nouvelleQuantiteRecue
            }
          });

          // Mettre à jour le stock si quantité reçue > 0
          if (ligneReception.quantiteRecue > 0) {
            const stock = ligneCommande.produit.stocks[0];
            if (stock) {
              await tx.stock.update({
                where: { id: stock.id },
                data: {
                  quantite: stock.quantite + ligneReception.quantiteRecue,
                  derniereEntree: new Date()
                },
              });

              // Créer un mouvement de stock
              await tx.mouvementStock.create({
                data: {
                  stockId: stock.id,
                  type: 'ENTREE',
                  quantite: ligneReception.quantiteRecue,
                  motif: `Réception partielle commande ${commande.numeroCommande} - ${ligneCommande.produit.nom}`,
                },
              });
            }

            // Calculer le montant pour cette ligne reçue
            montantTotalRecu += ligneReception.quantiteRecue * ligneCommande.prixUnitaire;
          }

          // Vérifier si cette ligne est complètement reçue
          if (nouvelleQuantiteRecue < ligneCommande.quantite && !validatedData.annulerReste) {
            toutesLignesRecues = false;
          }
        }

        // Si on annule le reste, ajuster les quantités et montants
        if (validatedData.annulerReste) {
          let nouveauMontantTotal = 0;
          
          for (const ligne of commande.lignes) {
            const ligneReception = validatedData.lignes.find(l => l.ligneCommandeId === ligne.id);
            const quantiteFinale = ligneReception ? ligne.quantiteRecue + ligneReception.quantiteRecue : ligne.quantiteRecue;
            
            // Mettre à jour le sous-total basé sur la quantité finalement reçue
            await tx.ligneCommande.update({
              where: { id: ligne.id },
              data: {
                quantite: quantiteFinale, // Ajuster la quantité commandée à la quantité reçue
                sousTotal: quantiteFinale * ligne.prixUnitaire
              }
            });

            nouveauMontantTotal += quantiteFinale * ligne.prixUnitaire;
          }

          // Mettre à jour le montant total de la commande
          await tx.commande.update({
            where: { id },
            data: {
              montantTotal: nouveauMontantTotal,
              montantRestant: nouveauMontantTotal - (validatedData.montantPaye || 0)
            }
          });

          toutesLignesRecues = true; // Forcer le statut à "reçue" si on annule le reste
        }

        // Déterminer le nouveau statut de la commande
        let nouveauStatut: 'EN_ATTENTE' | 'EN_COURS' | 'RECUE' = 'EN_COURS';
        if (toutesLignesRecues) {
          nouveauStatut = 'RECUE';
        }

        // Calculer le montant payé et restant
        const montantPaye = validatedData.montantPaye || 0;
        const montantRestant = (validatedData.annulerReste ? 
          await tx.commande.findUnique({ where: { id }, select: { montantTotal: true } }).then((c: any) => c.montantTotal) :
          commande.montantTotal) - montantPaye;

        // Mettre à jour la commande
        const commandeUpdated = await tx.commande.update({
          where: { id },
          data: {
            statut: nouveauStatut,
            dateReception: toutesLignesRecues ? new Date() : null,
            notes: validatedData.notes || commande.notes,
            montantPaye: montantPaye,
            montantRestant: montantRestant,
          },
          include: {
            fournisseur: true,
            lignes: {
              include: {
                produit: {
                  select: { nom: true }
                }
              }
            }
          }
        });

        // Créer une transaction financière si montant payé > 0
        if (montantPaye > 0) {
          await tx.transaction.create({
            data: {
              boutiqueId: session.user.boutiqueId!,
              userId: session.user.id!,
              type: 'ACHAT',
              montant: montantPaye,
              description: `Paiement ${validatedData.annulerReste ? 'final' : 'partiel'} commande #${commande.numeroCommande}`,
              categorieDepense: 'MARCHANDISES',
              dateTransaction: new Date()
            }
          });
        }

        return {
          commande: commandeUpdated,
          montantTotalRecu,
          lignesTraitees: validatedData.lignes.length,
          statutFinal: nouveauStatut
        };
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Données invalides', details: error.issues },
          { status: 400 }
        );
      }
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la réception partielle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}