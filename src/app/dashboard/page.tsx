import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Store, Package, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react"

async function getDashboardStats() {
  const [boutiquesCount, produitsCount, ventesCount, totalVentes] = await Promise.all([
    prisma.boutique.count(),
    prisma.produit.count(),
    prisma.vente.count(),
    prisma.vente.aggregate({
      _sum: {
        montantTotal: true,
      },
    }),
  ])

  return {
    boutiquesCount,
    produitsCount,
    ventesCount,
    totalVentes: totalVentes._sum.montantTotal || 0,
  }
}

async function getRecentBoutiques() {
  return await prisma.boutique.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          produits: true,
          ventes: true,
        },
      },
    },
  })
}

async function getLowStock() {
  // Récupérer tous les stocks avec leurs produits
  const stocks = await prisma.stock.findMany({
    include: {
      produit: true,
      boutique: true,
    },
  })

  // Filtrer ceux où la quantité est inférieure ou égale au seuil d'alerte
  return stocks
    .filter(stock => stock.quantite <= stock.produit.seuilAlerte)
    .slice(0, 5)
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats()
  const boutiques = await getRecentBoutiques()
  const lowStock = await getLowStock()

  const cards = [
    {
      title: "Boutiques",
      value: stats.boutiquesCount,
      icon: Store,
      color: "bg-blue-500",
    },
    {
      title: "Produits",
      value: stats.produitsCount,
      icon: Package,
      color: "bg-green-500",
    },
    {
      title: "Ventes",
      value: stats.ventesCount,
      icon: ShoppingCart,
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
          Bienvenue, {session?.user?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Vue d&apos;ensemble de votre activité commerciale
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Boutiques */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Boutiques récentes
          </h2>
          <div className="space-y-3">
            {boutiques.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune boutique</p>
            ) : (
              boutiques.map((boutique) => (
                <div
                  key={boutique.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{boutique.nom}</p>
                    <p className="text-sm text-gray-600">
                      {boutique._count.produits} produits • {boutique._count.ventes} ventes
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Alertes stock faible
          </h2>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune alerte</p>
            ) : (
              lowStock.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {stock.produit.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stock.boutique.nom} • Stock: {stock.quantite}
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
