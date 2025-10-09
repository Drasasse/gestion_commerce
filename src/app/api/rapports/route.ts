import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const rapportQuerySchema = z.object({
  type: z.enum(['ventes', 'produits', 'clients', 'stocks', 'financier']),
  periode: z.enum(['jour', 'semaine', 'mois', 'trimestre', 'annee']).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
})

interface RapportBase {
  type: string;
  periode?: {
    debut: Date;
    fin: Date;
  };
}

interface RapportVentes extends RapportBase {
  resume: {
    totalVentes: number;
    chiffreAffaires: number;
    ventesParJour: Array<{ date: string; nombre: number; montant: number }>;
  };
  produitsPopulaires: Array<{ produit: { nom: string }; _sum: { quantite: number } }>;
  statutsVente: Array<{ statut: string; _count: number }>;
}

interface RapportProduits extends RapportBase {
  resume: {
    totalProduits: number;
    prixMoyen: number;
  };
  produitsPopulaires: Array<{ nom: string; prixVente: number; categorie: { nom: string } }>;
  stocksAnalyse: {
    enRupture: number;
    stockFaible: number;
    stockNormal: number;
  };
}

interface RapportClients extends RapportBase {
  resume: {
    totalClients: number;
    clientsActifs: number;
    nouveauxClients: number;
  };
  clientsDetails: Array<{ nom: string; prenom: string; email?: string; telephone?: string }>;
  clientsActifs: Array<{ nom: string; prenom: string; email?: string; telephone?: string }>;
}

interface RapportStocks extends RapportBase {
  resume: {
    totalProduits: number;
    valeurTotaleStock: number;
  };
  analyse: {
    enRupture: Array<{ produit: { nom: string; prixVente: number; seuilAlerte: number } }>;
    stockFaible: Array<{ produit: { nom: string; prixVente: number; seuilAlerte: number } }>;
    stockNormal: Array<{ produit: { nom: string; prixVente: number; seuilAlerte: number } }>;
    valeurTotale: number;
  };
  mouvementsRecents: Array<{ type: string; quantite: number; motif: string; createdAt: Date }>;
}

interface RapportFinancier extends RapportBase {
  resume: {
    chiffreAffaires: number;
    recettes: number;
    depenses: number;
    benefice: number;
    solde: number;
  };
  transactionsParType: Array<{ type: string; montant: number; nombre: number }>;
  transactions: Array<{ type: string; montant: number; description: string; dateTransaction: Date }>;
}

type RapportType = RapportVentes | RapportProduits | RapportClients | RapportStocks | RapportFinancier;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.boutiqueId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = rapportQuerySchema.parse({
      type: searchParams.get('type'),
      periode: searchParams.get('periode'),
      dateDebut: searchParams.get('dateDebut'),
      dateFin: searchParams.get('dateFin'),
    })

    const boutiqueId = session.user.boutiqueId
    const now = new Date()
    let dateDebut: Date
    let dateFin: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // Calculer les dates selon la période
    if (query.dateDebut && query.dateFin) {
      dateDebut = new Date(query.dateDebut)
      dateFin = new Date(query.dateFin)
    } else {
      switch (query.periode) {
        case 'jour':
          dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'semaine':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          dateDebut = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          break
        case 'mois':
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'trimestre':
          const quarter = Math.floor(now.getMonth() / 3)
          dateDebut = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case 'annee':
          dateDebut = new Date(now.getFullYear(), 0, 1)
          break
        default:
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    let rapport: RapportType

    switch (query.type) {
      case 'ventes':
        rapport = await genererRapportVentes(boutiqueId, dateDebut, dateFin)
        break
      case 'produits':
        rapport = await genererRapportProduits(boutiqueId, dateDebut, dateFin)
        break
      case 'clients':
        rapport = await genererRapportClients(boutiqueId, dateDebut, dateFin)
        break
      case 'stocks':
        rapport = await genererRapportStocks(boutiqueId)
        break
      case 'financier':
        rapport = await genererRapportFinancier(boutiqueId, dateDebut, dateFin)
        break
    }

    return NextResponse.json({
      ...rapport,
      periode: {
        debut: dateDebut,
        fin: dateFin,
        type: query.periode || 'personnalisee'
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport" },
      { status: 500 }
    )
  }
}

async function genererRapportVentes(boutiqueId: string, dateDebut: Date, dateFin: Date) {
  const [ventes, ventesParJour, produitsVendus, statutsVente] = await Promise.all([
    // Statistiques générales
    prisma.vente.aggregate({
      where: {
        boutiqueId,
        dateVente: { gte: dateDebut, lte: dateFin }
      },
      _sum: { montantTotal: true },
      _count: true,
      _avg: { montantTotal: true }
    }),

    // Ventes par jour
    prisma.vente.groupBy({
      by: ['dateVente'],
      where: {
        boutiqueId,
        dateVente: { gte: dateDebut, lte: dateFin }
      },
      _sum: { montantTotal: true },
      _count: true,
      orderBy: { dateVente: 'asc' }
    }),

    // Produits les plus vendus
    prisma.ligneVente.groupBy({
      by: ['produitId'],
      where: {
        vente: {
          boutiqueId,
          dateVente: { gte: dateDebut, lte: dateFin }
        }
      },
      _sum: { quantite: true, sousTotal: true },
      orderBy: { _sum: { quantite: 'desc' } },
      take: 10
    }),

    // Statut des ventes
    prisma.vente.groupBy({
      by: ['statut'],
      where: {
        boutiqueId,
        dateVente: { gte: dateDebut, lte: dateFin }
      },
      _sum: { montantTotal: true },
      _count: true
    })
  ])

  // Enrichir les produits vendus avec les détails
  const produitsDetails = await prisma.produit.findMany({
    where: {
      id: { in: produitsVendus.map(p => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true }
  })

  const produitsVendusAvecDetails = produitsVendus.map(pv => {
    const produit = produitsDetails.find(p => p.id === pv.produitId)
    return {
      ...pv,
      produit
    }
  })

  return {
    type: 'ventes',
    resume: {
      totalVentes: ventes._sum.montantTotal || 0,
      nombreVentes: ventes._count,
      venteMoyenne: ventes._avg.montantTotal || 0
    },
    ventesParJour: ventesParJour.map(v => ({
      date: v.dateVente,
      montant: v._sum.montantTotal || 0,
      nombre: v._count
    })),
    produitsVendus: produitsVendusAvecDetails,
    statutsVente: statutsVente.map(m => ({
      statut: m.statut,
      montant: m._sum.montantTotal || 0,
      nombre: m._count
    }))
  }
}

async function genererRapportProduits(boutiqueId: string, dateDebut: Date, dateFin: Date) {
  const [produitsStats, produitsPopulaires, produitsStock] = await Promise.all([
    // Statistiques générales des produits
    prisma.produit.aggregate({
      where: { boutiqueId },
      _count: true,
      _avg: { prixVente: true }
    }),

    // Produits populaires (basé sur les ventes)
    prisma.ligneVente.groupBy({
      by: ['produitId'],
      where: {
        vente: {
          boutiqueId,
          dateVente: { gte: dateDebut, lte: dateFin }
        }
      },
      _sum: { quantite: true, sousTotal: true },
      orderBy: { _sum: { sousTotal: 'desc' } },
      take: 10
    }),

    // État des stocks
    prisma.stock.findMany({
      where: { produit: { boutiqueId } },
      include: {
        produit: { select: { nom: true, prixVente: true, seuilAlerte: true } }
      }
    })
  ])

  // Enrichir les produits populaires
  const produitsDetails = await prisma.produit.findMany({
    where: {
      id: { in: produitsPopulaires.map(p => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true, categorie: { select: { nom: true } } }
  })

  const produitsPopulairesAvecDetails = produitsPopulaires.map(pp => {
    const produit = produitsDetails.find(p => p.id === pp.produitId)
    return {
      ...pp,
      produit
    }
  })

  // Analyser les stocks
  const stocksAnalyse = {
    enRupture: produitsStock.filter(s => s.quantite === 0).length,
    stockFaible: produitsStock.filter(s => s.quantite > 0 && s.quantite <= s.produit.seuilAlerte).length,
    stockNormal: produitsStock.filter(s => s.quantite > s.produit.seuilAlerte).length
  }

  return {
    type: 'produits',
    resume: {
      totalProduits: produitsStats._count,
      prixMoyen: produitsStats._avg.prixVente || 0
    },
    produitsPopulaires: produitsPopulairesAvecDetails,
    stocks: {
      analyse: stocksAnalyse,
      details: produitsStock.map(s => ({
        produit: s.produit,
        quantite: s.quantite,
        seuilAlerte: s.seuilAlerte,
        statut: s.quantite === 0 ? 'rupture' : 
                s.quantite <= s.seuilAlerte ? 'faible' : 'normal'
      }))
    }
  }
}

async function genererRapportClients(boutiqueId: string, dateDebut: Date, dateFin: Date) {
  const [clientsStats, clientsActifs, nouveauxClients] = await Promise.all([
    // Statistiques générales
    prisma.client.aggregate({
      where: { boutiqueId },
      _count: true
    }),

    // Clients les plus actifs
    prisma.vente.groupBy({
      by: ['clientId'],
      where: {
        boutiqueId,
        dateVente: { gte: dateDebut, lte: dateFin },
        clientId: { not: null }
      },
      _sum: { montantTotal: true },
      _count: true,
      orderBy: { _sum: { montantTotal: 'desc' } },
      take: 10
    }),

    // Nouveaux clients
    prisma.client.count({
      where: {
        boutiqueId,
        dateCreation: { gte: dateDebut, lte: dateFin }
      }
    })
  ])

  // Enrichir les clients actifs
  const clientsDetails = await prisma.client.findMany({
    where: {
      id: { in: clientsActifs.map(c => c.clientId).filter(Boolean) as string[] }
    },
    select: { id: true, prenom: true, nom: true, telephone: true }
  })

  const clientsActifsAvecDetails = clientsActifs.map(ca => {
    const client = clientsDetails.find(c => c.id === ca.clientId)
    return {
      ...ca,
      client
    }
  })

  return {
    type: 'clients',
    resume: {
      totalClients: clientsStats._count,
      nouveauxClients
    },
    clientsActifs: clientsActifsAvecDetails
  }
}

async function genererRapportStocks(boutiqueId: string) {
  const [stocks, mouvementsRecents] = await Promise.all([
    // État des stocks
    prisma.stock.findMany({
      where: { produit: { boutiqueId } },
      include: {
        produit: { 
          select: { 
            nom: true, 
            prixVente: true, 
            seuilAlerte: true,
            categorie: { select: { nom: true } } 
          } 
        }
      }
    }),

    // Mouvements récents
    prisma.mouvementStock.findMany({
      where: {
        stock: { produit: { boutiqueId } }
      },
      include: {
        stock: {
          include: {
            produit: { select: { nom: true } }
          }
        }
      },
      orderBy: { dateCreation: 'desc' },
      take: 20
    })
  ])

  const analyse = {
    enRupture: stocks.filter(s => s.quantite === 0),
    stockFaible: stocks.filter(s => s.quantite > 0 && s.quantite <= s.produit.seuilAlerte),
    stockNormal: stocks.filter(s => s.quantite > s.produit.seuilAlerte),
    valeurTotale: stocks.reduce((total, s) => total + (s.quantite * s.produit.prixVente), 0)
  }

  return {
    type: 'stocks',
    resume: {
      totalProduits: stocks.length,
      enRupture: analyse.enRupture.length,
      stockFaible: analyse.stockFaible.length,
      valeurTotale: analyse.valeurTotale
    },
    analyse,
    mouvementsRecents
  }
}

async function genererRapportFinancier(boutiqueId: string, dateDebut: Date, dateFin: Date) {
  const [transactionsList, ventes] = await Promise.all([
    // Transactions financières
    prisma.transaction.findMany({
      where: {
        boutiqueId,
        dateTransaction: { gte: dateDebut, lte: dateFin }
      },
      orderBy: { dateTransaction: 'desc' }
    }),

    // Ventes pour calculer le chiffre d'affaires
    prisma.vente.aggregate({
      where: {
        boutiqueId,
        dateVente: { gte: dateDebut, lte: dateFin }
      },
      _sum: { montantTotal: true }
    })
  ])

  // Détail des transactions par type
  const transactionsParType = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      boutiqueId,
      dateTransaction: { gte: dateDebut, lte: dateFin }
    },
    _sum: { montant: true },
    _count: true
  })

  const recettes = transactionsParType
    .filter(t => t.type === 'RECETTE')
    .reduce((sum, t) => sum + (t._sum.montant || 0), 0)

  const depenses = transactionsParType
    .filter(t => t.type === 'DEPENSE')
    .reduce((sum, t) => sum + (t._sum.montant || 0), 0)

  return {
    type: 'financier',
    resume: {
      chiffreAffaires: ventes._sum.montantTotal || 0,
      recettes,
      depenses,
      benefice: (ventes._sum.montantTotal || 0) - depenses,
      solde: recettes - depenses
    },
    transactionsParType: transactionsParType.map(t => ({
      type: t.type,
      montant: t._sum.montant || 0,
      nombre: t._count
    })),
    transactions: transactionsList
  }
}