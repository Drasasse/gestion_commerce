import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkRateLimit, apiRateLimiter, sensitiveApiRateLimiter } from '@/lib/rate-limit'
import { invalidateByTag } from '@/lib/cache'
// Interfaces TypeScript
interface Paiement {
  id: string;
  montant: number;
}
interface VenteAvecPaiements {
  id: string;
  montantTotal: number;
  dateEcheance: Date | null;
  paiements: Paiement[];
}
const paiementSchema = z.object({
  venteId: z.string(),
  montant: z.number().positive(),
  methodePaiement: z.enum(['ESPECES', 'CARTE', 'VIREMENT', 'CHEQUE', 'MOBILE']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})
const creanceQuerySchema = z.object({
  statut: z.enum(['PAYE', 'IMPAYE', 'PARTIEL']).optional(),
  clientId: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autoris�" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const boutiqueIdParam = searchParams.get('boutiqueId')
    let query;
    try {
      query = creanceQuerySchema.parse({
        statut: searchParams.get('statut'),
        clientId: searchParams.get('clientId'),
        dateDebut: searchParams.get('dateDebut'),
        dateFin: searchParams.get('dateFin'),
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
      });
    } catch (error) {
      console.error('Validation error in query params:', error);
      // Use default values if validation fails
      query = {
        statut: undefined,
        clientId: undefined,
        dateDebut: undefined,
        dateFin: undefined,
        page: '1',
        limit: '10',
      };
    }
    // D�terminer le boutiqueId � utiliser
    let boutiqueId: string;
    if (session.user.role === 'ADMIN' && boutiqueIdParam) {
      // Admin peut sp�cifier une boutique
      boutiqueId = boutiqueIdParam;
    } else if (session.user.boutiqueId) {
      // Gestionnaire utilise sa boutique
      boutiqueId = session.user.boutiqueId;
    } else {
      return NextResponse.json(
        { error: 'Boutique non sp�cifi�e' },
        { status: 400 }
      );
    }
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const skip = (page - 1) * limit
    // Construire les filtres
    type PaymentStatus = 'PAYE' | 'IMPAYE' | 'PARTIEL';
    const where: {
      boutiqueId: string;
      statut?: PaymentStatus | { not: PaymentStatus };
      clientId?: string;
      dateVente?: { gte?: Date; lte?: Date };
    } = {
      boutiqueId,
      statut: { not: 'PAYE' } // Par d�faut, afficher les cr�ances non pay�es
    }
    if (query.statut && (query.statut === 'PAYE' || query.statut === 'IMPAYE' || query.statut === 'PARTIEL')) {
      where.statut = query.statut as PaymentStatus
    }
    if (query.clientId) {
      where.clientId = query.clientId
    }
    if (query.dateDebut || query.dateFin) {
      where.dateVente = {}
      if (query.dateDebut) {
        where.dateVente.gte = new Date(query.dateDebut)
      }
      if (query.dateFin) {
        where.dateVente.lte = new Date(query.dateFin)
      }
    }
    // R�cup�rer les cr�ances
    const [creances, total] = await Promise.all([
      prisma.vente.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              telephone: true,
              email: true
            }
          },
          paiements: {
            orderBy: { dateCreation: 'desc' }
          }
        },
        orderBy: { dateVente: 'desc' },
        skip,
        take: limit
      }),
      prisma.vente.count({ where })
    ])
    // Calculer les montants pour chaque cr�ance
    const creancesAvecMontants = (creances as VenteAvecPaiements[]).map((vente) => {
      const montantPaye = vente.paiements.reduce((sum: number, p) => sum + p.montant, 0)
      const montantRestant = vente.montantTotal - montantPaye
      const joursRetard = vente.dateEcheance ? 
        Math.max(0, Math.floor((new Date().getTime() - new Date(vente.dateEcheance).getTime()) / (1000 * 60 * 60 * 24))) : 0
      return {
        ...vente,
        montantPaye,
        montantRestant,
        joursRetard,
        enRetard: vente.dateEcheance ? new Date() > new Date(vente.dateEcheance) : false
      }
    })
    // Statistiques globales
    const stats = await prisma.vente.aggregate({
      where: { boutiqueId },
      _sum: { montantTotal: true },
      _count: true
    })
    const statsCreances = await prisma.vente.groupBy({
      by: ['statut'],
      where: { boutiqueId },
      _sum: { montantTotal: true },
      _count: true
    })
    // Calculer le total des paiements
    const totalPaiements = await prisma.paiement.aggregate({
      where: {
        vente: { boutiqueId }
      },
      _sum: { montant: true }
    })
    const montantTotalCreances = stats._sum.montantTotal || 0
    const montantTotalPaye = totalPaiements._sum.montant || 0
    const montantTotalRestant = montantTotalCreances - montantTotalPaye
    return NextResponse.json({
      creances: creancesAvecMontants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistiques: {
        montantTotalCreances,
        montantTotalPaye,
        montantTotalRestant,
        nombreCreances: stats._count,
        repartitionStatuts: statsCreances.map((s) => ({
          statut: s.statut,
          montant: s._sum.montantTotal || 0,
          nombre: s._count
        }))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la r�cup�ration des cr�ances:', error)
    return NextResponse.json(
      { error: "Erreur lors de la r�cup�ration des cr�ances" },
      { status: 500 }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autoris�" }, { status: 401 })
    }
    const body = await request.json()
    const data = paiementSchema.parse(body)
    // D�terminer le boutiqueId
    const boutiqueId = session.user.boutiqueId || body.boutiqueId;
    if (!boutiqueId) {
      return NextResponse.json(
        { error: 'Boutique non sp�cifi�e' },
        { status: 400 }
      );
    }
    // V�rifier que la vente existe et appartient � la boutique
    const vente = await prisma.vente.findFirst({
      where: {
        id: data.venteId,
        boutiqueId
      },
      include: {
        paiements: true
      }
    })
    if (!vente) {
      return NextResponse.json(
        { error: "Vente non trouv�e" },
        { status: 404 }
      )
    }
    // Calculer le montant d�j� pay�
    const montantPaye = vente.paiements.reduce((sum: number, p) => sum + p.montant, 0)
    const montantRestant = vente.montantTotal - montantPaye
    // V�rifier que le montant du paiement ne d�passe pas le montant restant
    if (data.montant > montantRestant) {
      return NextResponse.json(
        { error: "Le montant du paiement d�passe le montant restant" },
        { status: 400 }
      )
    }
    // Cr�er le paiement et mettre � jour le statut de la vente
    const result = await prisma.$transaction(async (tx) => {
      // Cr�er le paiement
      const paiement = await tx.paiement.create({
        data: {
          venteId: data.venteId,
          montant: data.montant,
          methodePaiement: data.methodePaiement,
          reference: data.reference,
          notes: data.notes,
          dateCreation: new Date()
        }
      })
      // Calculer le nouveau montant pay�
      const nouveauMontantPaye = montantPaye + data.montant
      const nouveauMontantRestant = vente.montantTotal - nouveauMontantPaye
      // D�terminer le nouveau statut
      let nouveauStatut: 'PAYE' | 'IMPAYE' | 'PARTIEL'
      if (nouveauMontantRestant === 0) {
        nouveauStatut = 'PAYE'
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'PARTIEL'
      } else {
        nouveauStatut = 'IMPAYE'
      }
      // Mettre � jour le statut de la vente
      const venteUpdated = await tx.vente.update({
        where: { id: data.venteId },
        data: { statut: nouveauStatut }
      })
      // Cr�er une transaction financi�re pour le paiement
      await tx.transaction.create({
        data: {
          boutiqueId,
          userId: session.user.id,
          type: 'RECETTE',
          montant: data.montant,
          description: `Paiement vente #${vente.numeroVente}`,
          dateTransaction: new Date()
        }
      })
      return { paiement, vente: venteUpdated }
    })
    return NextResponse.json(result.paiement, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la cr�ation du paiement:', error)
    return NextResponse.json(
      { error: "Erreur lors de la cr�ation du paiement" },
      { status: 500 }
    )
  }
}