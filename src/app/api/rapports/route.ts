import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Interfaces TypeScript pour les données de rapport
interface ProduitVendu {
  produitId: string
  _sum: { quantite: number | null; sousTotal: number | null }
}

interface ProduitDetail {
  id: string
  nom: string
  prixVente: number
  categorie?: { nom: string } | null
}

interface VenteParJour {
  dateVente: Date
  _sum: { montantTotal: number | null }
  _count: number
}

interface StatutVente {
  statut: string
  _sum: { montantTotal: number | null }
  _count: number
}

interface ProduitPopulaire {
  produitId: string
  _sum: { quantite: number | null }
}

interface StockProduit {
  id: string
  boutiqueId: string
  createdAt: Date
  updatedAt: Date
  quantite: number
  derniereEntree: Date | null
  derniereSortie: Date | null
  produitId: string
  produit: {
    nom: string
    prixVente: number
    seuilAlerte: number
  }
}

interface ClientActif {
  clientId: string | null
  _sum: { montantTotal: number | null }
  _count: number
}

interface ClientDetail {
  id: string
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
}

interface TransactionParType {
  type: string
  _sum: { montant: number | null }
  _count: number
}

interface Transaction {
  id: string
  montant: number
  description: string
  dateTransaction: Date
}

const rapportQuerySchema = z.object({
  type: z.string().refine((val) => ['ventes', 'produits', 'clients', 'stocks', 'financier'].includes(val), {
    message: "Le type doit être l'un de: ventes, produits, clients, stocks, financier"
  }),
  periode: z.string().refine((val) => ['jour', 'semaine', 'mois', 'trimestre', 'annee'].includes(val), {
    message: "La période doit être l'une de: jour, semaine, mois, trimestre, annee"
  }).optional(),
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
    nombreVentes: number;
    venteMoyenne: number;
    chiffreAffaires: number;
  };
  ventesParJour: Array<{ date: Date; montant: number; nombre: number }>;
  produitsVendus: Array<{ produitId: string; nom: string; quantiteVendue: number; chiffreAffaires: number }>;
  methodesVente: Array<{ methode: string; nombre: number; montant: number }>;
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
  mouvementsRecents: Array<{ 
    id: string; 
    type: string; 
    quantite: number; 
    motif: string; 
    dateCreation: string;
    produit: {
      nom: string;
    }
  }>;
}

interface RapportFinancier extends RapportBase {
  resume: {
    capitalInitial: number;
    totalInjections: number;
    chiffreAffaires: number;
    recettes: number;
    depensesTotales: number;
    depensesMarchandises: number;
    depensesExploitation: number;
    autresDepenses: number;
    beneficeBrut: number;
    beneficeNet: number;
    margeCommerciale: number;
    cashFlow: number;
    solde: number;
  };
  depensesParCategorie: Array<{ categorie: string; montant: number; nombre: number }>;
  transactionsParType: Array<{ type: string; montant: number; nombre: number }>;
  transactions: Array<{ type: string; montant: number; description: string; dateTransaction: Date; categorieDepense?: string }>;
}

type RapportType = RapportVentes | RapportProduits | RapportClients | RapportStocks | RapportFinancier;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const boutiqueId = session.user.boutiqueId
    if (!boutiqueId) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type'),
      periode: searchParams.get('periode'),
      dateDebut: searchParams.get('dateDebut'),
      dateFin: searchParams.get('dateFin')
    }

    console.log('Paramètres reçus pour rapport:', queryParams)
    console.log('URL complète:', request.url)

    const validation = rapportQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      console.error('Erreur de validation:', validation.error.issues)
      return NextResponse.json({ 
        error: `Paramètres invalides. Le paramètre 'type' est requis et doit être l'un de: ventes, produits, clients, stocks, financier`,
        details: validation.error.issues
      }, { status: 400 })
    }

    const query = validation.data
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
      default:
        return NextResponse.json({ 
          error: `Type de rapport non supporté: ${query.type}` 
        }, { status: 400 })
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
      id: { in: (produitsVendus as ProduitVendu[]).map(p => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true }
  })

  const produitsVendusAvecDetails = (produitsVendus as ProduitVendu[]).map(pv => {
    const produit = (produitsDetails as ProduitDetail[]).find(p => p.id === pv.produitId)
    return {
      ...pv,
      produit
    }
  })

  const totalVentes = ventes._sum.montantTotal || 0
  const nombreVentes = ventes._count || 0
  const venteMoyenne = nombreVentes > 0 ? totalVentes / nombreVentes : 0

  return {
    type: 'ventes',
    resume: {
      totalVentes: totalVentes,
      nombreVentes: nombreVentes,
      venteMoyenne: venteMoyenne,
      chiffreAffaires: totalVentes
    },
    ventesParJour: (ventesParJour as VenteParJour[]).map(v => ({
      date: v.dateVente,
      montant: v._sum.montantTotal || 0,
      nombre: v._count
    })),
    produitsVendus: produitsVendusAvecDetails.map(pv => ({
      produitId: pv.produitId,
      nom: pv.produit?.nom || 'Produit inconnu',
      quantiteVendue: pv._sum.quantite || 0,
      chiffreAffaires: pv._sum.sousTotal || 0
    })),
    methodesVente: (statutsVente as StatutVente[]).map(s => ({
      methode: s.statut,
      nombre: s._count,
      montant: s._sum.montantTotal || 0
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
      id: { in: (produitsPopulaires as ProduitPopulaire[]).map(p => p.produitId) }
    },
    select: { id: true, nom: true, prixVente: true, categorie: { select: { nom: true } } }
  })

  // Analyser les stocks
  const stocksAnalyse = {
    enRupture: (produitsStock as StockProduit[]).filter(s => s.quantite === 0).length,
    stockFaible: (produitsStock as StockProduit[]).filter(s => s.quantite > 0 && s.quantite <= s.produit.seuilAlerte).length,
    stockNormal: (produitsStock as StockProduit[]).filter(s => s.quantite > s.produit.seuilAlerte).length
  }

  return {
    type: 'produits',
    resume: {
      totalProduits: produitsStats._count,
      prixMoyen: produitsStats._avg.prixVente || 0
    },
    produitsPopulaires: (produitsDetails as ProduitDetail[]).map(p => ({
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
      id: { in: (clientsActifs as ClientActif[]).map(c => c.clientId).filter(Boolean) as string[] }
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
    clientsDetails: (allClientsDetails as ClientDetail[]).map(c => ({
      nom: c.nom,
      prenom: c.prenom || '',
      email: c.email || undefined,
      telephone: c.telephone || undefined
    })),
    clientsActifs: (clientsDetails as ClientDetail[]).map(c => ({
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
      id: m.id,
      type: m.type,
      quantite: m.quantite,
      motif: m.motif || '',
      dateCreation: m.createdAt.toISOString(),
      produit: {
        nom: m.stock.produit.nom
      }
    }))
  }
}

async function genererRapportFinancier(boutiqueId: string, dateDebut: Date, dateFin: Date) {
  const [transactionsList, ventes, boutique, capitalTransactions] = await Promise.all([
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
    }),

    // Informations de la boutique
    prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { capitalInitial: true }
    }),

    // Transactions de capital (injections)
    prisma.transaction.findMany({
      where: {
        boutiqueId,
        type: 'INJECTION_CAPITAL'
      },
      orderBy: { dateTransaction: 'desc' }
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

  const depensesTotales = Math.abs(transactionsParType
    .filter((t: any) => t.type === 'DEPENSE')
    .reduce((sum: number, t: any) => sum + (t._sum.montant || 0), 0))

  // Calcul des dépenses par catégorie
  const depensesParCategorie = await prisma.transaction.groupBy({
    by: ['categorieDepense'],
    where: {
      boutiqueId,
      type: 'DEPENSE',
      dateTransaction: { gte: dateDebut, lte: dateFin }
    },
    _sum: { montant: true },
    _count: true
  })

  const depensesMarchandises = Math.abs(depensesParCategorie
    .filter((d: any) => d.categorieDepense === 'MARCHANDISES')
    .reduce((sum: number, d: any) => sum + (d._sum.montant || 0), 0))

  const depensesExploitation = Math.abs(depensesParCategorie
    .filter((d: any) => d.categorieDepense === 'EXPLOITATION')
    .reduce((sum: number, d: any) => sum + (d._sum.montant || 0), 0))

  const autresDepenses = Math.abs(depensesParCategorie
    .filter((d: any) => d.categorieDepense && d.categorieDepense !== 'MARCHANDISES' && d.categorieDepense !== 'EXPLOITATION')
    .reduce((sum: number, d: any) => sum + (d._sum.montant || 0), 0))

  // Calcul des injections de capital
  const totalInjections = capitalTransactions.reduce((sum: number, t: any) => sum + (t.montant || 0), 0)
  
  // Calcul de la trésorerie (position de caisse)
  const capitalInitial = boutique?.capitalInitial || 0
  const tresorerie = capitalInitial + totalInjections + recettes - depensesTotales
  
  // Calculs financiers corrects
  const chiffreAffaires = ventes._sum.montantTotal || 0
  const beneficeBrut = chiffreAffaires - depensesMarchandises  // Marge commerciale
  const beneficeNet = chiffreAffaires - depensesTotales        // Bénéfice après toutes charges
  const cashFlow = recettes - depensesTotales                  // Flux de trésorerie période
  const margeCommerciale = chiffreAffaires > 0 ? (beneficeBrut / chiffreAffaires) * 100 : 0

  return {
    type: 'financier',
    resume: {
      capitalInitial,
      totalInjections,
      chiffreAffaires,
      recettes,
      depensesTotales,
      depensesMarchandises,
      depensesExploitation,
      autresDepenses,
      beneficeBrut,
      beneficeNet,
      cashFlow,
      margeCommerciale,
      solde: tresorerie
    },
    depensesParCategorie: depensesParCategorie.map((d: any) => ({
      categorie: d.categorieDepense || 'NON_CATEGORISE',
      montant: Math.abs(d._sum.montant || 0),
      nombre: d._count
    })),
    transactionsParType: (transactionsParType as TransactionParType[]).map(t => ({
      type: t.type,
      montant: t._sum.montant || 0,
      nombre: t._count
    })),
    transactions: transactionsList.map(t => ({
      type: t.type,
      montant: t.montant,
      description: t.description,
      dateTransaction: t.dateTransaction,
      categorieDepense: t.categorieDepense || undefined
    })),
    injections: (capitalTransactions as Transaction[]).map(t => ({
      id: t.id,
      montant: t.montant,
      description: t.description,
      dateTransaction: t.dateTransaction
    }))
  }
}