'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Building2, Calendar, DollarSign,
  FileText, CheckCircle, XCircle, Clock, Truck
} from 'lucide-react';
import { formatMontant, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LigneCommande {
  id: string;
  produit: {
    id: string;
    nom: string;
  };
  quantite: number;
  quantiteRecue: number;
  prixUnitaire: number;
  sousTotal: number;
}

interface Commande {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RECUE' | 'ANNULEE';
  dateCommande: string;
  dateReception?: string;
  dateEcheance?: string;
  notes?: string;
  fournisseur: {
    id: string;
    nom: string;
    prenom?: string;
    entreprise?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
  };
  lignes: LigneCommande[];
}

const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Truck },
  RECUE: { label: 'Reçue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function CommandeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecevoirModal, setShowRecevoirModal] = useState(false);
  const [quantitesRecues, setQuantitesRecues] = useState<Record<string, number>>({});
  const [montantPaye, setMontantPaye] = useState<string>('');
  const [annulerReste, setAnnulerReste] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (status !== 'loading' && !session) {
      redirect('/login');
    }
    if (session) {
      loadCommande();
    }
  }, [session, status, id]);

  const loadCommande = async () => {
    try {
      const response = await fetch(`/api/commandes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCommande(data);

        // Initialiser les quantités reçues
        const initialQuantites: Record<string, number> = {};
        data.lignes.forEach((ligne: LigneCommande) => {
          initialQuantites[ligne.id] = ligne.quantite - ligne.quantiteRecue;
        });
        setQuantitesRecues(initialQuantites);
      } else {
        toast.error('Erreur lors du chargement de la commande');
        router.push('/boutique/commandes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRecevoir = async () => {
    if (!commande) return;

    try {
      // Transformer les données au format attendu par l'API
      const lignesRecues = Object.entries(quantitesRecues)
        .filter(([_, quantite]) => quantite > 0)
        .map(([ligneId, quantiteRecue]) => ({
          ligneId,
          quantiteRecue,
        }));

      const requestData: { 
        lignesRecues: typeof lignesRecues; 
        montantPaye?: number;
        notes?: string;
        annulerReste?: boolean;
      } = {
        lignesRecues,
      };

      // Ajouter le montant payé s'il est fourni
      if (montantPaye && parseFloat(montantPaye) > 0) {
        requestData.montantPaye = parseFloat(montantPaye);
      }

      // Ajouter les notes si fournies
      if (notes.trim()) {
        requestData.notes = notes.trim();
      }

      // Ajouter l'option d'annulation du reste
      if (annulerReste) {
        requestData.annulerReste = true;
      }

      const response = await fetch(`/api/commandes/${id}/recevoir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          annulerReste 
            ? 'Commande finalisée avec succès! Le reste a été annulé.' 
            : 'Commande réceptionnée avec succès!'
        );
        setShowRecevoirModal(false);
        setMontantPaye('');
        setNotes('');
        setAnnulerReste(false);
        loadCommande();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la réception');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la réception');
    }
  };

  const handleAnnuler = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;

    try {
      const response = await fetch(`/api/commandes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'ANNULEE' }),
      });

      if (response.ok) {
        toast.success('Commande annulée');
        loadCommande();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Commande non trouvée</p>
      </div>
    );
  }

  const statutInfo = STATUTS[commande.statut];
  const StatusIcon = statutInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux commandes
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              {commande.numeroCommande}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Commandé le {formatDate(commande.dateCommande)}
            </p>
          </div>

          <div className="flex gap-2">
            {commande.statut === 'EN_ATTENTE' && (
              <>
                <button
                  onClick={() => setShowRecevoirModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Recevoir
                </button>
                <button
                  onClick={handleAnnuler}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Annuler
                </button>
              </>
            )}
            {commande.statut === 'EN_COURS' && (
              <button
                onClick={() => setShowRecevoirModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Terminer réception
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Statut de la commande</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {commande.statut === 'RECUE' && commande.dateReception
                      ? `Reçue le ${formatDate(commande.dateReception)}`
                      : statutInfo.label}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statutInfo.color}`}>
                {statutInfo.label}
              </span>
            </div>
          </div>

          {/* Produits commandés */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits commandés ({commande.lignes.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {commande.lignes.map((ligne) => (
                <div key={ligne.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{ligne.produit.nom}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Qté: {ligne.quantite}</span>
                        <span>Prix unitaire: {formatMontant(ligne.prixUnitaire)}</span>
                        {ligne.quantiteRecue > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            Reçu: {ligne.quantiteRecue}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatMontant(ligne.sousTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatMontant(commande.montantTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {commande.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" />
                Notes
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{commande.notes}</p>
            </div>
          )}
        </div>

        {/* Colonne sidebar */}
        <div className="space-y-6">
          {/* Fournisseur */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5" />
              Fournisseur
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {commande.fournisseur.nom} {commande.fournisseur.prenom}
                </p>
                {commande.fournisseur.entreprise && (
                  <p className="text-gray-500 dark:text-gray-400">{commande.fournisseur.entreprise}</p>
                )}
              </div>
              {commande.fournisseur.telephone && (
                <p className="text-gray-600 dark:text-gray-300">📞 {commande.fournisseur.telephone}</p>
              )}
              {commande.fournisseur.email && (
                <p className="text-gray-600 dark:text-gray-300">✉️ {commande.fournisseur.email}</p>
              )}
              {commande.fournisseur.adresse && (
                <p className="text-gray-600 dark:text-gray-300">📍 {commande.fournisseur.adresse}</p>
              )}
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5" />
              Paiement
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Montant total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatMontant(commande.montantTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Montant payé</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatMontant(commande.montantPaye)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white font-semibold">Reste à payer</span>
                <span className={`font-bold ${commande.montantRestant > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatMontant(commande.montantRestant)}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" />
              Dates importantes
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Commandé</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(commande.dateCommande)}
                </span>
              </div>
              {commande.dateEcheance && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Échéance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(commande.dateEcheance)}
                  </span>
                </div>
              )}
              {commande.dateReception && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Reçue</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatDate(commande.dateReception)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Réception */}
      {showRecevoirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Réceptionner la commande</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Indiquez les quantités reçues pour chaque produit
              </p>
            </div>

            <div className="p-6 space-y-4">
              {commande.lignes.map((ligne) => (
                <div key={ligne.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{ligne.produit.nom}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Commandé: {ligne.quantite} | Déjà reçu: {ligne.quantiteRecue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantité à recevoir:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={ligne.quantite - ligne.quantiteRecue}
                      value={quantitesRecues[ligne.id] || 0}
                      onChange={(e) =>
                        setQuantitesRecues({
                          ...quantitesRecues,
                          [ligne.id]: Math.min(
                            parseInt(e.target.value) || 0,
                            ligne.quantite - ligne.quantiteRecue
                          ),
                        })
                      }
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      / {ligne.quantite - ligne.quantiteRecue} restant
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Champ montant payé */}
            <div className="px-6 pb-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Paiement (optionnel)</h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Montant payé:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={commande?.montantRestant || 0}
                    step="0.01"
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    / {formatMontant(commande?.montantRestant || 0)} restant
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Si vous effectuez un paiement, une transaction de dépense sera automatiquement créée.
                </p>
              </div>
            </div>

            {/* Notes et options avancées */}
            <div className="px-6 pb-4 space-y-4">
              {/* Notes */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur cette réception..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Option d'annulation du reste */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="annulerReste"
                    checked={annulerReste}
                    onChange={(e) => setAnnulerReste(e.target.checked)}
                    className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="annulerReste" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      Annuler le reste de la commande
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Si coché, les quantités non reçues seront définitivement annulées et le montant total de la commande sera ajusté.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRecevoirModal(false);
                  setMontantPaye('');
                  setNotes('');
                  setAnnulerReste(false);
                  setQuantitesRecues({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleRecevoir}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmer réception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
