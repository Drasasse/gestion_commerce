import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
// Interfaces TypeScript
interface Paiement {
  id: string;
  montant: number;
}

interface Vente {
  id: string;
  montantTotal: number;
  paiements: Paiement[];
}

const paiementUpdateSchema = z.object({
  montant: z.number().positive().optional(),
  methodePaiement: z.enum(['ESPECES', 'CARTE', 'VIREMENT', 'CHEQUE', 'MOBILE']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const boutiqueId = session.user.boutiqueId
    const { id: paiementId } = await params

    const paiement = await prisma.paiement.findFirst({
      where: {
        id: paiementId,
        vente: { boutiqueId }
      },
      include: {
        vente: {
          include: {
            client: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                telephone: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!paiement) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(paiement)

  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du paiement" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = paiementUpdateSchema.parse(body)
    const boutiqueId = session.user.boutiqueId
    const { id: paiementId } = await params

    // Vérifier que le paiement existe et appartient à la boutique
    const paiementExistant = await prisma.paiement.findFirst({
      where: {
        id: paiementId,
        vente: { boutiqueId }
      },
      include: {
        vente: {
          include: {
            paiements: true
          }
        }
      }
    })

    if (!paiementExistant) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      )
    }

    // Si le montant change, vérifier que le nouveau total ne dépasse pas le montant de la vente
     if (data.montant && data.montant !== paiementExistant.montant) {
       const autresPaiements = paiementExistant.vente.paiements.filter(p => p.id !== paiementId)
       const montantAutresPaiements = autresPaiements.reduce((sum: number, p) => sum + p.montant, 0)
      const nouveauTotal = montantAutresPaiements + data.montant

      if (nouveauTotal > paiementExistant.vente.montantTotal) {
        return NextResponse.json(
          { error: "Le montant total des paiements dépasse le montant de la vente" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le paiement et recalculer le statut de la vente
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le paiement
      const paiementUpdated = await tx.paiement.update({
        where: { id: paiementId },
        data: data
      })

      // Recalculer le statut de la vente
      const vente = await tx.vente.findUnique({
        where: { id: paiementExistant.venteId },
        include: { paiements: true }
      })

      if (vente) {
         const montantTotalPaye = vente.paiements.reduce((sum: number, p: Paiement) => sum + p.montant, 0)
        const montantRestant = vente.montantTotal - montantTotalPaye

        let nouveauStatut: 'PAYE' | 'IMPAYE' | 'PARTIEL'
        if (montantRestant === 0) {
          nouveauStatut = 'PAYE'
        } else if (montantTotalPaye > 0) {
          nouveauStatut = 'PARTIEL'
        } else {
          nouveauStatut = 'IMPAYE'
        }

        await tx.vente.update({
          where: { id: vente.id },
          data: { statut: nouveauStatut }
        })

        // Mettre à jour la transaction financière associée si elle existe
        if (data.montant && data.montant !== paiementExistant.montant) {
          await tx.transaction.updateMany({
            where: {
              type: 'RECETTE',
              montant: paiementExistant.montant,
              description: { contains: `Paiement vente #${vente.numeroVente}` }
            },
            data: {
              montant: data.montant,
              description: `Paiement vente #${vente.numeroVente} (modifié)`
            }
          })
        }
      }

      return paiementUpdated
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement:', error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du paiement" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const boutiqueId = session.user.boutiqueId
    const { id: paiementId } = await params

    // Vérifier que le paiement existe et appartient à la boutique
    const paiement = await prisma.paiement.findFirst({
      where: {
        id: paiementId,
        vente: { boutiqueId }
      },
      include: {
        vente: {
          include: {
            paiements: true
          }
        }
      }
    })

    if (!paiement) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      )
    }

    // Supprimer le paiement et recalculer le statut de la vente
    await prisma.$transaction(async (tx) => {
      // Supprimer le paiement
      await tx.paiement.delete({
        where: { id: paiementId }
      })

      // Recalculer le statut de la vente
       const autresPaiements = paiement.vente.paiements.filter(p => p.id !== paiementId)
       const montantTotalPaye = autresPaiements.reduce((sum: number, p) => sum + p.montant, 0)
      const montantRestant = paiement.vente.montantTotal - montantTotalPaye

      let nouveauStatut: 'PAYE' | 'IMPAYE' | 'PARTIEL'
      if (montantRestant === 0) {
        nouveauStatut = 'PAYE'
      } else if (montantTotalPaye > 0) {
        nouveauStatut = 'PARTIEL'
      } else {
        nouveauStatut = 'IMPAYE'
      }

      await tx.vente.update({
        where: { id: paiement.venteId },
        data: { statut: nouveauStatut }
      })

      // Supprimer la transaction financière associée
      await tx.transaction.deleteMany({
        where: {
          type: 'RECETTE',
          montant: paiement.montant,
          description: { contains: `Paiement vente #${paiement.vente.numeroVente}` }
        }
      })
    })

    return NextResponse.json({ message: "Paiement supprimé avec succès" })

  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du paiement" },
      { status: 500 }
    )
  }
}