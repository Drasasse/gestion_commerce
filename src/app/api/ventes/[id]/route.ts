import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const paiementSchema = z.object({
  montantPaye: z.number().min(0, 'Le montant payé doit être positif'),
});

export async function GET(
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

    const vente = await prisma.vente.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        client: true,
        user: {
          select: { name: true }
        },
        lignes: {
          include: {
            produit: {
              select: { nom: true, prixVente: true }
            }
          }
        },
        mouvements: {
          include: {
            stock: {
              include: {
                produit: {
                  select: { nom: true }
                }
              }
            }
          }
        }
      },
    });

    if (!vente) {
      return NextResponse.json(
        { error: 'Vente non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(vente);
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Vérifier que la vente existe et appartient à la boutique
    const existingVente = await prisma.vente.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!existingVente) {
      return NextResponse.json(
        { error: 'Vente non trouvée' },
        { status: 404 }
      );
    }

    try {
      const validatedData = paiementSchema.parse(body);

      // Calculer le nouveau montant restant
      const nouveauMontantRestant = existingVente.montantTotal - validatedData.montantPaye;

      // Déterminer le nouveau statut
      let nouveauStatut: 'PAYE' | 'IMPAYE' | 'PARTIEL' = 'PAYE';
      if (validatedData.montantPaye === 0) {
        nouveauStatut = 'IMPAYE';
      } else if (nouveauMontantRestant > 0) {
        nouveauStatut = 'PARTIEL';
      }

      const vente = await prisma.vente.update({
        where: { id },
        data: {
          montantPaye: validatedData.montantPaye,
          montantRestant: nouveauMontantRestant,
          statut: nouveauStatut,
        },
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

      return NextResponse.json(vente);
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
    console.error('Erreur lors de la mise à jour de la vente:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Vérifier que la vente existe et appartient à la boutique
    const existingVente = await prisma.vente.findFirst({
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
        },
        mouvements: true
      }
    });

    if (!existingVente) {
      return NextResponse.json(
        { error: 'Vente non trouvée' },
        { status: 404 }
      );
    }

    // Annuler la vente en restaurant les stocks
    await prisma.$transaction(async (tx) => {
      // Restaurer les stocks
      for (const ligne of existingVente.lignes) {
        const stock = ligne.produit.stocks[0];
        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantite: stock.quantite + ligne.quantite,
            },
          });

          // Créer un mouvement de stock pour l'annulation
          await tx.mouvementStock.create({
            data: {
              stockId: stock.id,
              type: 'ENTREE',
              quantite: ligne.quantite,
              motif: `Annulation vente ${existingVente.numeroVente}`,
            },
          });
        }
      }

      // Supprimer les mouvements de stock liés à cette vente
      await tx.mouvementStock.deleteMany({
        where: { venteId: id },
      });

      // Supprimer les lignes de vente
      await tx.ligneVente.deleteMany({
        where: { venteId: id },
      });

      // Supprimer la vente
      await tx.vente.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: 'Vente annulée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la vente:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}