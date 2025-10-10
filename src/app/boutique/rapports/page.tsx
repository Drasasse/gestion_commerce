'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Download,
  AlertTriangle,
  ShoppingCart,
  Target
} from 'lucide-react'

interface RapportData {
  type: string
  periode: {
    debut: string
    fin: string
    type: string
  }
  resume: {
    [key: string]: number | string
  }
  produitsVendus?: Array<{
    produitId: string
    nom: string
    quantiteVendue: number
    chiffreAffaires: number
  }>
  methodesVente?: Array<{
    methode: string
    nombre: number
    montant: number
  }>
  produitsPopulaires?: Array<{
    produitId: string
    nom: string
    quantiteVendue: number
    categorie?: string
  }>
  clientsActifs?: Array<{
    clientId: string
    nom: string
    prenom?: string
    nombreAchats: number
    montantTotal: number
  }>
  mouvementsRecents?: Array<{
    id: string
    type: string
    quantite: number
    motif: string
    dateCreation: string
    produit: {
      nom: string
    }
  }>
  transactionsParType?: Array<{
    type: string
    nombre: number
    montant: number
  }>
  stocks?: {
    analyse: {
      enRupture: number
      stockFaible: number
      stockNormal: number
    }
  }
  [key: string]: unknown
}

export default function RapportsPage() {
  const [rapportType, setRapportType] = useState<'ventes' | 'produits' | 'clients' | 'stocks' | 'financier'>('ventes')
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee'>('mois')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [rapportData, setRapportData] = useState<RapportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRapport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        type: rapportType,
        periode: periode
      })

      if (dateDebut && dateFin) {
        params.append('dateDebut', dateDebut)
        params.append('dateFin', dateFin)
      }

      const response = await fetch(`/api/rapports?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du rapport')
      }

      const data = await response.json()
      setRapportData(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }, [rapportType, periode, dateDebut, dateFin])

  useEffect(() => {
    loadRapport()
  }, [loadRapport])

  const exporterRapport = () => {
    if (!rapportData) return

    const dataStr = JSON.stringify(rapportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-${rapportType}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(montant)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const renderRapportVentes = () => {
    if (!rapportData || rapportType !== 'ventes') return null

    return (
      <div className="space-y-6">
        {/* Résumé des ventes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total des ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.totalVentes))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Nombre de ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.nombreVentes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Vente moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.venteMoyenne))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Produits les plus vendus */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Produits les plus vendus</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {rapportData.produitsVendus?.slice(0, 5).map((item, index: number) => (
                <div key={item.produitId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.nom}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantiteVendue} unités vendues
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatMontant(item.chiffreAffaires || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Méthodes de vente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Répartition par méthode de vente</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rapportData.methodesVente?.map((methode) => (
                <div key={methode.methode} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 capitalize">{methode.methode}</span>
                    <span className="text-sm text-gray-600">{methode.nombre} ventes</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600 mt-1">
                    {formatMontant(methode.montant)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRapportProduits = () => {
    if (!rapportData || rapportType !== 'produits') return null

    return (
      <div className="space-y-6">
        {/* Résumé des produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total produits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.totalProduits}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Prix moyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.prixMoyen))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* État des stocks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">État des stocks</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <span className="font-medium text-red-700">En rupture</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {rapportData.stocks?.analyse.enRupture}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <span className="font-medium text-yellow-700">Stock faible</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {rapportData.stocks?.analyse.stockFaible}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Package className="text-green-500" size={20} />
                  <span className="font-medium text-green-700">Stock normal</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {rapportData.stocks?.analyse.stockNormal}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Produits populaires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Produits populaires</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {rapportData.produitsPopulaires?.slice(0, 5).map((item, index: number) => (
                <div key={item.produitId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.nom}</p>
                      <p className="text-sm text-gray-600">
                        Catégorie: {item.categorie || 'Non définie'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Populaire
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantiteVendue} vendus
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRapportClients = () => {
    if (!rapportData || rapportType !== 'clients') return null

    return (
      <div className="space-y-6">
        {/* Résumé des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.totalClients}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Nouveaux clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.nouveauxClients}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clients les plus actifs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Clients les plus actifs</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {rapportData.clientsActifs?.map((item, index: number) => (
                <div key={item.clientId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.prenom} {item.nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        Client actif
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatMontant(item.montantTotal || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.nombreAchats} achats
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRapportStocks = () => {
    if (!rapportData || rapportType !== 'stocks') return null

    return (
      <div className="space-y-6">
        {/* Résumé des stocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total produits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.totalProduits}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">En rupture</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.enRupture}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Stock faible</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapportData.resume.stockFaible}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Valeur totale</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.valeurTotale))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mouvements récents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Mouvements récents</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {rapportData.mouvementsRecents?.slice(0, 10).map((mouvement) => (
                <div key={mouvement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{mouvement.produit.nom}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(mouvement.dateCreation)} - {mouvement.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      mouvement.type === 'ENTREE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                    </p>
                    <p className="text-sm text-gray-600">{mouvement.motif}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRapportFinancier = () => {
    if (!rapportData || rapportType !== 'financier') return null

    return (
      <div className="space-y-6">
        {/* Résumé financier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Chiffre d&apos;affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.chiffreAffaires))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Recettes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.recettes))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Dépenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(Number(rapportData.resume.depenses))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                Number(rapportData.resume.benefice) >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Target className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Bénéfice</p>
                <p className={`text-2xl font-bold ${
                  Number(rapportData.resume.benefice) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatMontant(Number(rapportData.resume.benefice))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions par type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Répartition des transactions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rapportData.transactionsParType?.map((transaction) => (
                <div key={transaction.type} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 capitalize">
                      {transaction.type === 'RECETTE' ? 'Recettes' : 'Dépenses'}
                    </span>
                    <span className="text-sm text-gray-600">{transaction.nombre} transactions</span>
                  </div>
                  <p className={`text-lg font-semibold mt-1 ${
                    transaction.type === 'RECETTE' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatMontant(transaction.montant)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rapports et Analyses</h1>
              <p className="text-gray-600 mt-2">Tableaux de bord et analyses de performance</p>
            </div>
            <button
              onClick={exporterRapport}
              disabled={!rapportData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Exporter
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport
              </label>
              <select
                value={rapportType}
                onChange={(e) => setRapportType(e.target.value as 'ventes' | 'produits' | 'clients' | 'financier')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ventes">Ventes</option>
                <option value="produits">Produits</option>
                <option value="clients">Clients</option>
                <option value="stocks">Stocks</option>
                <option value="financier">Financier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value as 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="jour">Aujourd&apos;hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="annee">Cette année</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contenu du rapport */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Génération du rapport...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div>
            {rapportType === 'ventes' && renderRapportVentes()}
            {rapportType === 'produits' && renderRapportProduits()}
            {rapportType === 'clients' && renderRapportClients()}
            {rapportType === 'stocks' && renderRapportStocks()}
            {rapportType === 'financier' && renderRapportFinancier()}
          </div>
        )}
      </div>
    </div>
  )
}