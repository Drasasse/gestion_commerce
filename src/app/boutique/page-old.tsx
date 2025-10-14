import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle, FolderOpen, DollarSign, CreditCard } from "lucide-react"
import Link from "next/link"

async function getBoutiqueStats(boutiqueId: string) {
  const [produitsCount, ventesCount, clientsCount, totalVentes, stocks] = await Promise.all([
    prisma.produit.count({
      where: { boutiqueId },
    }),
    prisma.vente.count({
      where: { boutiqueId },
    }),
    prisma.client.count({
      where: { boutiqueId },
    }),
    prisma.vente.aggregate({
      where: { boutiqueId },
      _sum: {
        montantTotal: true,
        montantRestant: true,
      },
    }),
    prisma.stock.findMany({
      where: {
        boutiqueId,
        quantite: {
          lte: 5,
        },
      },
      include: {
        produit: true,
      },
      take: 5,
    }),
  ])

  return {
    produitsCount,
    ventesCount,
    clientsCount,
    totalVentes: totalVentes._sum.montantTotal || 0,
    impayesTotal: totalVentes._sum.montantRestant || 0,
    stocks,
  }
}

async function getRecentVentes(boutiqueId: string) {
  return await prisma.vente.findMany({
    where: { boutiqueId },
    take: 5,
    orderBy: {
      dateVente: "desc",
    },
    include: {
      client: true,
      user: true,
    },
  })
}

export default async function BoutiquePage() {
  const session = await auth()
  const boutiqueId = session?.user?.boutiqueId

  if (!boutiqueId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Aucune boutique assignée
          </h1>
          <p className="text-gray-600">
            Contactez l&apos;administrateur pour vous assigner une boutique.
          </p>
        </div>
      </div>
    )
  }

  const stats = await getBoutiqueStats(boutiqueId)
  const recentVentes = await getRecentVentes(boutiqueId)

  const cards = [
    {
      title: "Produits",
      value: stats.produitsCount,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Ventes",
      value: stats.ventesCount,
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    {
      title: "Clients",
      value: stats.clientsCount,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Chiffre d'affaires",
      value: `${stats.totalVentes.toLocaleString()} FCFA`,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {session?.user?.boutique?.nom}
        </h1>
        <p className="text-gray-600 mt-1">
          Tableau de bord de votre boutique
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
        <Link href="/boutique/produits" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gérer les produits</h3>
                <p className="text-gray-600 text-sm">Ajouter, modifier et supprimer des produits</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/categories" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg group-hover:bg-purple-600 transition-colors">
                <FolderOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gérer les catégories</h3>
                <p className="text-gray-600 text-sm">Organiser vos produits par catégories</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/clients" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg group-hover:bg-green-600 transition-colors">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gérer les clients</h3>
                <p className="text-gray-600 text-sm">Ajouter et gérer votre base clients</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/ventes" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg group-hover:bg-orange-600 transition-colors">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gérer les ventes</h3>
                <p className="text-gray-600 text-sm">Créer et suivre vos ventes</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/stocks" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg group-hover:bg-red-600 transition-colors">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gérer les stocks</h3>
                <p className="text-gray-600 text-sm">Suivre les inventaires et mouvements</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/transactions" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg group-hover:bg-yellow-600 transition-colors">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
                <p className="text-gray-600 text-sm">Gérer recettes et dépenses</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/rapports" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg group-hover:bg-indigo-600 transition-colors">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rapports</h3>
                <p className="text-gray-600 text-sm">Analyses et tableaux de bord</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/boutique/paiements" className="group">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg group-hover:bg-orange-600 transition-colors">
                <CreditCard className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Paiements</h3>
                <p className="text-gray-600 text-sm">Gérer créances et paiements</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {stats.impayesTotal > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle size={20} />
            <span className="font-semibold">
              Impayés: {stats.impayesTotal.toLocaleString()} FCFA
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ventes récentes
          </h2>
          <div className="space-y-3">
            {recentVentes.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune vente</p>
            ) : (
              recentVentes.map((vente: any) => (
                <div
                  key={vente.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {vente.numeroVente}
                    </p>
                    <p className="text-sm text-gray-600">
                      {vente.client?.nom || "Client anonyme"} • {new Date(vente.dateVente).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {vente.montantTotal.toLocaleString()} FCFA
                    </p>
                    {vente.statut === "IMPAYE" && (
                      <span className="text-xs text-red-600">Impayé</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Stock faible
          </h2>
          <div className="space-y-3">
            {stats.stocks.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune alerte</p>
            ) : (
              stats.stocks.map((stock: any) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {stock.produit.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock restant: {stock.quantite}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
