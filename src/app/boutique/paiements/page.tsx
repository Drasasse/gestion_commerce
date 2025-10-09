'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Search,
  Eye
} from 'lucide-react'

interface Client {
  id: string
  prenom: string
  nom: string
  telephone?: string
  email?: string
}

interface Paiement {
  id: string
  montant: number
  methodePaiement: string
  reference?: string
  notes?: string
  dateCreation: string
}

interface Creance {
  id: string
  montantTotal: number
  montantPaye: number
  montantRestant: number
  statutPaiement: string
  dateVente: string
  dateEcheance?: string
  joursRetard: number
  enRetard: boolean
  client?: Client
  paiements: Paiement[]
}

interface Statistiques {
  montantTotalCreances: number
  montantTotalPaye: number
  montantTotalRestant: number
  nombreCreances: number
  repartitionStatuts: Array<{
    statut: string
    montant: number
    nombre: number
  }>
}

export default function PaiementsPage() {
  const [creances, setCreances] = useState<Creance[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [showPaiementModal, setShowPaiementModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCreance, setSelectedCreance] = useState<Creance | null>(null)

  // Formulaire de paiement
  const [paiementForm, setPaiementForm] = useState({
    venteId: '',
    montant: '',
    methodePaiement: 'ESPECES',
    reference: '',
    notes: ''
  })

  const loadCreances = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statutFilter) params.append('statut', statutFilter)
      if (clientFilter) params.append('clientId', clientFilter)
      if (dateDebut) params.append('dateDebut', dateDebut)
      if (dateFin) params.append('dateFin', dateFin)

      const response = await fetch(`/api/paiements?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des créances')
      }

      const data = await response.json()
      setCreances(data.creances)
      setStatistiques(data.statistiques)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des créances')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statutFilter, clientFilter, dateDebut, dateFin])

  useEffect(() => {
    loadCreances()
  }, [loadCreances])

  const handleCreatePaiement = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paiementForm,
          montant: parseFloat(paiementForm.montant)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du paiement')
      }

      setShowPaiementModal(false)
      setPaiementForm({
        venteId: '',
        montant: '',
        methodePaiement: 'ESPECES',
        reference: '',
        notes: ''
      })
      loadCreances()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    }
  }

  const openPaiementModal = (creance: Creance) => {
    setSelectedCreance(creance)
    setPaiementForm({
      venteId: creance.id,
      montant: creance.montantRestant.toString(),
      methodePaiement: 'ESPECES',
      reference: '',
      notes: ''
    })
    setShowPaiementModal(true)
  }

  const openDetailsModal = (creance: Creance) => {
    setSelectedCreance(creance)
    setShowDetailsModal(true)
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

  const getStatutBadge = (statut: string, enRetard: boolean) => {
    if (enRetard) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">En retard</span>
    }

    switch (statut) {
      case 'PAYE':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Payé</span>
      case 'PARTIEL':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Partiel</span>
      case 'EN_ATTENTE':
        return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">En attente</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">{statut}</span>
    }
  }

  const filteredCreances = creances.filter(creance => {
    const matchesSearch = !searchTerm || 
      (creance.client && 
        (`${creance.client.prenom} ${creance.client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
         creance.client.telephone?.includes(searchTerm)))
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paiements et Créances</h1>
              <p className="text-gray-600 mt-2">Gestion des paiements et suivi des créances</p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {statistiques && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total créances</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(statistiques.montantTotalCreances)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Montant payé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(statistiques.montantTotalPaye)}
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
                  <p className="text-gray-600 text-sm">Montant restant</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMontant(statistiques.montantTotalRestant)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <CreditCard className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Nombre créances</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.nombreCreances}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="PARTIEL">Partiel</option>
                <option value="PAYE">Payé</option>
                <option value="EN_RETARD">En retard</option>
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

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatutFilter('')
                  setClientFilter('')
                  setDateDebut('')
                  setDateFin('')
                  setSearchTerm('')
                  setCurrentPage(1)
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des créances */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Créances</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : filteredCreances.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Aucune créance trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant payé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant restant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date vente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCreances.map((creance) => (
                    <tr key={creance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {creance.client ? `${creance.client.prenom} ${creance.client.nom}` : 'Client anonyme'}
                          </p>
                          {creance.client?.telephone && (
                            <p className="text-sm text-gray-500">{creance.client.telephone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatMontant(creance.montantTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-green-600 font-medium">
                          {formatMontant(creance.montantPaye)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-red-600 font-medium">
                          {formatMontant(creance.montantRestant)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatutBadge(creance.statutPaiement, creance.enRetard)}
                        {creance.joursRetard > 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            {creance.joursRetard} jour(s) de retard
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(creance.dateVente)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailsModal(creance)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          {creance.montantRestant > 0 && (
                            <button
                              onClick={() => openPaiementModal(creance)}
                              className="text-green-600 hover:text-green-900"
                              title="Ajouter paiement"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de paiement */}
        {showPaiementModal && selectedCreance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ajouter un paiement
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Client:</p>
                <p className="font-medium">
                  {selectedCreance.client ? `${selectedCreance.client.prenom} ${selectedCreance.client.nom}` : 'Client anonyme'}
                </p>
                <p className="text-sm text-gray-600 mt-2">Montant restant:</p>
                <p className="font-medium text-red-600">
                  {formatMontant(selectedCreance.montantRestant)}
                </p>
              </div>

              <form onSubmit={handleCreatePaiement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant du paiement *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedCreance.montantRestant}
                    value={paiementForm.montant}
                    onChange={(e) => setPaiementForm({ ...paiementForm, montant: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement *
                  </label>
                  <select
                    value={paiementForm.methodePaiement}
                    onChange={(e) => setPaiementForm({ ...paiementForm, methodePaiement: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="ESPECES">Espèces</option>
                    <option value="CARTE">Carte bancaire</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="MOBILE">Paiement mobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={paiementForm.reference}
                    onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Numéro de transaction, chèque..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paiementForm.notes}
                    onChange={(e) => setPaiementForm({ ...paiementForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Notes additionnelles..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaiementModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {showDetailsModal && selectedCreance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la créance
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatMontant(selectedCreance.montantTotal)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant payé</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatMontant(selectedCreance.montantPaye)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant restant</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatMontant(selectedCreance.montantRestant)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Statut</p>
                    <div className="mt-1">
                      {getStatutBadge(selectedCreance.statutPaiement, selectedCreance.enRetard)}
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                {selectedCreance.client && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Informations client</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Nom:</span> {selectedCreance.client.prenom} {selectedCreance.client.nom}
                      </p>
                      {selectedCreance.client.telephone && (
                        <p className="text-sm">
                          <span className="font-medium">Téléphone:</span> {selectedCreance.client.telephone}
                        </p>
                      )}
                      {selectedCreance.client.email && (
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {selectedCreance.client.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Historique des paiements */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Historique des paiements</h4>
                  {selectedCreance.paiements.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun paiement enregistré</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedCreance.paiements.map((paiement) => (
                        <div key={paiement.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatMontant(paiement.montant)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {paiement.methodePaiement} • {formatDate(paiement.dateCreation)}
                              </p>
                              {paiement.reference && (
                                <p className="text-sm text-gray-500">
                                  Réf: {paiement.reference}
                                </p>
                              )}
                              {paiement.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {paiement.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}