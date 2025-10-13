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
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boutiqueIdParam = searchParams.get('boutiqueId')

    let query;
    try {
      query = rapportQuerySchema.parse({
        type: searchParams.get('type'),
        periode: searchParams.get('periode'),
        dateDebut: searchParams.get('dateDebut'),
        dateFin: searchParams.get('dateFin'),
      });
    } catch (error) {
      console.error('Validation error in query params:', error);
      return NextResponse.json(
        { error: "Paramètres invalides. Le paramètre 'type' est requis et doit être l'un de: ventes, produits, clients, stocks, financier" },
        { status: 400 }
      );
    }

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
      id: { in: produitsVendus.map((p: any) => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true }
  })

  const produitsVendusAvecDetails = produitsVendus.map((pv: any) => {
    const produit = produitsDetails.find((p: any) => p.id === pv.produitId)
    return {
      ...pv,
      produit
    }
  })

  return {
    type: 'ventes',
    resume: {
      totalVentes: ventes._count || 0,
      chiffreAffaires: ventes._sum.montantTotal || 0,
      ventesParJour: ventesParJour.map((v: any) => ({
        date: v.dateVente.toISOString().split('T')[0],
        nombre: v._count,
        montant: v._sum.montantTotal || 0
      }))
    },
    ventesParJour: ventesParJour.map((v: any) => ({
      date: v.dateVente,
      montant: v._sum.montantTotal || 0,
      nombre: v._count
    })),
    produitsVendus: produitsVendusAvecDetails,
    produitsPopulaires: produitsVendus.slice(0, 5).map((pv: any) => {
      const produit = produitsDetails.find((p: any) => p.id === pv.produitId);
      return {
        produit: produit ? { nom: produit.nom } : { nom: 'Inconnu' },
        _sum: {
          quantite: pv._sum.quantite || 0
        }
      };
    }),
    statutsVente: statutsVente.map((m: any) => ({
      statut: m.statut,
      _count: m._count
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
      id: { in: produitsPopulaires.map((p: any) => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true, categorie: { select: { nom: true } } }
  })

  // Analyser les stocks
  const stocksAnalyse = {
    enRupture: produitsStock.filter((s: any) => s.quantite === 0).length,
    stockFaible: produitsStock.filter((s: any) => s.quantite > 0 && s.quantite <= s.produit.seuilAlerte).length,
    stockNormal: produitsStock.filter((s: any) => s.quantite > s.produit.seuilAlerte).length
  }

  return {
    type: 'produits',
    resume: {
      totalProduits: produitsStats._count,
      prixMoyen: produitsStats._avg.prixVente || 0
    },
    produitsPopulaires: produitsDetails.map((p: any) => ({
      nom: p.nom,
      prixVente: p.prixVente,
      categorie: { nom: p.categorie?.nom || 'Sans catégorie' }
    })),
    stocksAnalyse: stocksAnalyse
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
        createdAt: { gte: dateDebut, lte: dateFin }
      }
    })
  ])

  // Tous les clients
  const allClientsDetails = await prisma.client.findMany({
    where: { boutiqueId },
    select: { nom: true, prenom: true, email: true, telephone: true }
  })

  // Enrichir les clients actifs
  const clientsDetails = await prisma.client.findMany({
    where: {
      id: { in: clientsActifs.map((c: any) => c.clientId).filter(Boolean) as string[] }
    },
    select: { id: true, prenom: true, nom: true, telephone: true, email: true }
  })

  return {
    type: 'clients',
    resume: {
      totalClients: clientsStats._count,
      clientsActifs: clientsActifs.length,
      nouveauxClients
    },
    clientsDetails: allClientsDetails.map((c: any) => ({
      nom: c.nom,
      prenom: c.prenom || '',
      email: c.email || undefined,
      telephone: c.telephone || undefined
    })),
    clientsActifs: clientsDetails.map((c: any) => ({
      nom: c.nom,
      prenom: c.prenom || '',
      email: c.email || undefined,
      telephone: c.telephone || undefined
    }))
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
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ])

  const analyse = {
    enRupture: stocks.filter((s: any) => s.quantite === 0),
    stockFaible: stocks.filter((s: any) => s.quantite > 0 && s.quantite <= s.produit.seuilAlerte),
    stockNormal: stocks.filter((s: any) => s.quantite > s.produit.seuilAlerte),
    valeurTotale: stocks.reduce((total: number, s: any) => total + (s.quantite * s.produit.prixVente), 0)
  }

  return {
    type: 'stocks',
    resume: {
      totalProduits: stocks.length,
      valeurTotaleStock: analyse.valeurTotale,
      valeurTotale: analyse.valeurTotale,
      enRupture: analyse.enRupture.length,
      stockFaible: analyse.stockFaible.length
    },
    analyse: {
      enRupture: analyse.enRupture.map((s: any) => ({
        produit: {
          nom: s.produit.nom,
          prixVente: s.produit.prixVente,
          seuilAlerte: s.produit.seuilAlerte
        }
      })),
      stockFaible: analyse.stockFaible.map((s: any) => ({
        produit: {
          nom: s.produit.nom,
          prixVente: s.produit.prixVente,
          seuilAlerte: s.produit.seuilAlerte
        }
      })),
      stockNormal: analyse.stockNormal.map((s: any) => ({
        produit: {
          nom: s.produit.nom,
          prixVente: s.produit.prixVente,
          seuilAlerte: s.produit.seuilAlerte
        }
      })),
      valeurTotale: analyse.valeurTotale
    },
    mouvementsRecents: mouvementsRecents.map((m: any) => ({
      type: m.type,
      quantite: m.quantite,
      motif: m.motif || '',
      createdAt: m.createdAt
    }))
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
    .filter((t: any) => t.type === 'RECETTE')
    .reduce((sum: number, t: any) => sum + (t._sum.montant || 0), 0)

  const depenses = transactionsParType
    .filter((t: any) => t.type === 'DEPENSE')
    .reduce((sum: number, t: any) => sum + (t._sum.montant || 0), 0)

  return {
    type: 'financier',
    resume: {
      chiffreAffaires: ventes._sum.montantTotal || 0,
      recettes,
      depenses,
      benefice: (ventes._sum.montantTotal || 0) - depenses,
      solde: recettes - depenses
    },
    transactionsParType: transactionsParType.map((t: any) => ({
      type: t.type,
      montant: t._sum.montant || 0,
      nombre: t._count
    })),
    transactions: transactionsList
  }
}