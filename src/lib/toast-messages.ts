/**
 * Messages toast standardisés pour toute l'application
 * Utilise react-hot-toast
 */

import toast from 'react-hot-toast';

// Configuration par défaut des toasts
export const toastConfig = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
  },
};

/**
 * Messages de succès standardisés
 */
export const successMessages = {
  // Ventes
  venteCreated: () => toast.success('✅ Vente enregistrée avec succès!', toastConfig),
  venteUpdated: () => toast.success('✅ Vente modifiée avec succès!', toastConfig),
  venteDeleted: () => toast.success('✅ Vente supprimée avec succès!', toastConfig),

  // Produits
  produitCreated: () => toast.success('✅ Produit ajouté avec succès!', toastConfig),
  produitUpdated: () => toast.success('✅ Produit modifié avec succès!', toastConfig),
  produitDeleted: () => toast.success('✅ Produit supprimé avec succès!', toastConfig),

  // Catégories
  categorieCreated: () => toast.success('✅ Catégorie créée avec succès!', toastConfig),
  categorieUpdated: () => toast.success('✅ Catégorie modifiée avec succès!', toastConfig),
  categorieDeleted: () => toast.success('✅ Catégorie supprimée avec succès!', toastConfig),

  // Clients
  clientCreated: () => toast.success('✅ Client ajouté avec succès!', toastConfig),
  clientUpdated: () => toast.success('✅ Client modifié avec succès!', toastConfig),
  clientDeleted: () => toast.success('✅ Client supprimé avec succès!', toastConfig),

  // Stocks
  stockUpdated: () => toast.success('✅ Stock mis à jour avec succès!', toastConfig),
  mouvementCreated: () => toast.success('✅ Mouvement de stock enregistré!', toastConfig),

  // Paiements
  paiementCreated: () => toast.success('✅ Paiement enregistré avec succès!', toastConfig),
  paiementUpdated: () => toast.success('✅ Paiement modifié avec succès!', toastConfig),

  // Transactions
  transactionCreated: () => toast.success('✅ Transaction enregistrée!', toastConfig),
  transactionDeleted: () => toast.success('✅ Transaction supprimée!', toastConfig),

  // Boutiques (Admin)
  boutiqueCreated: () => toast.success('✅ Boutique créée avec succès!', toastConfig),
  boutiqueUpdated: () => toast.success('✅ Boutique modifiée avec succès!', toastConfig),
  boutiqueDeleted: () => toast.success('✅ Boutique supprimée avec succès!', toastConfig),

  // Utilisateurs (Admin)
  userCreated: () => toast.success('✅ Utilisateur créé avec succès!', toastConfig),
  userUpdated: () => toast.success('✅ Utilisateur modifié avec succès!', toastConfig),
  userDeleted: () => toast.success('✅ Utilisateur supprimé avec succès!', toastConfig),

  // Capital (Admin)
  capitalInjected: () => toast.success('✅ Injection de capital enregistrée!', toastConfig),

  // Général
  dataSaved: () => toast.success('✅ Données enregistrées!', toastConfig),
  dataExported: () => toast.success('✅ Données exportées avec succès!', toastConfig),
  printSuccess: () => toast.success('✅ Impression lancée!', toastConfig),
  copySuccess: () => toast.success('✅ Copié dans le presse-papier!', toastConfig),
};

/**
 * Messages d'erreur standardisés
 */
export const errorMessages = {
  // Ventes
  venteCreateError: () => toast.error('❌ Erreur lors de la création de la vente', toastConfig),
  venteUpdateError: () => toast.error('❌ Erreur lors de la modification', toastConfig),
  venteDeleteError: () => toast.error('❌ Erreur lors de la suppression', toastConfig),
  stockInsuffisant: (produit: string) => toast.error(`❌ Stock insuffisant pour ${produit}!`, toastConfig),

  // Produits
  produitCreateError: () => toast.error('❌ Erreur lors de l\'ajout du produit', toastConfig),
  produitUpdateError: () => toast.error('❌ Erreur lors de la modification', toastConfig),
  produitDeleteError: () => toast.error('❌ Erreur lors de la suppression', toastConfig),
  produitInUse: () => toast.error('❌ Ce produit est utilisé dans des ventes', toastConfig),

  // Catégories
  categorieCreateError: () => toast.error('❌ Erreur lors de la création', toastConfig),
  categorieDeleteError: () => toast.error('❌ Erreur lors de la suppression', toastConfig),
  categorieInUse: () => toast.error('❌ Cette catégorie contient des produits', toastConfig),

  // Clients
  clientCreateError: () => toast.error('❌ Erreur lors de l\'ajout du client', toastConfig),
  clientUpdateError: () => toast.error('❌ Erreur lors de la modification', toastConfig),
  clientDeleteError: () => toast.error('❌ Erreur lors de la suppression', toastConfig),
  clientInUse: () => toast.error('❌ Ce client a des ventes associées', toastConfig),

  // Stocks
  stockUpdateError: () => toast.error('❌ Erreur lors de la mise à jour du stock', toastConfig),
  mouvementCreateError: () => toast.error('❌ Erreur lors de l\'enregistrement', toastConfig),

  // Paiements
  paiementCreateError: () => toast.error('❌ Erreur lors de l\'enregistrement', toastConfig),
  montantInvalide: () => toast.error('❌ Montant invalide!', toastConfig),

  // Authentification
  loginError: () => toast.error('❌ Identifiants incorrects', toastConfig),
  unauthorized: () => toast.error('❌ Accès non autorisé', toastConfig),
  sessionExpired: () => toast.error('❌ Session expirée, reconnectez-vous', toastConfig),

  // Général
  networkError: () => toast.error('❌ Erreur de connexion au serveur', toastConfig),
  validationError: (message?: string) => toast.error(`❌ ${message || 'Données invalides'}`, toastConfig),
  serverError: () => toast.error('❌ Erreur serveur, réessayez plus tard', toastConfig),
  notFound: (resource: string) => toast.error(`❌ ${resource} introuvable`, toastConfig),
  exportError: () => toast.error('❌ Erreur lors de l\'export', toastConfig),
  printError: () => toast.error('❌ Erreur lors de l\'impression', toastConfig),
};

/**
 * Messages d'information
 */
export const infoMessages = {
  stockFaible: (produit: string, quantite: number) =>
    toast(`ℹ️ Stock faible: ${produit} (${quantite} restants)`, {
      ...toastConfig,
      icon: '⚠️',
      style: {
        ...toastConfig.style,
        background: '#FEF3C7',
        color: '#92400E',
      },
    }),

  paiementPartiel: (montant: number, total: number) =>
    toast(`ℹ️ Paiement partiel: ${montant} FCFA sur ${total} FCFA`, {
      ...toastConfig,
      icon: '💰',
      style: {
        ...toastConfig.style,
        background: '#DBEAFE',
        color: '#1E40AF',
      },
    }),

  impayeElevé: (client: string, montant: number) =>
    toast(`⚠️ Impayés élevés pour ${client}: ${montant} FCFA`, {
      ...toastConfig,
      icon: '⚠️',
      duration: 6000,
      style: {
        ...toastConfig.style,
        background: '#FEE2E2',
        color: '#991B1B',
      },
    }),

  dataLoading: () => toast.loading('Chargement en cours...', toastConfig),
  dataSaving: () => toast.loading('Enregistrement en cours...', toastConfig),
  dataExporting: () => toast.loading('Export en cours...', toastConfig),

  noData: () => toast('ℹ️ Aucune donnée disponible', toastConfig),
  noChanges: () => toast('ℹ️ Aucune modification détectée', toastConfig),
};

/**
 * Messages de confirmation (pour les modals)
 */
export const confirmMessages = {
  deleteVente: 'Êtes-vous sûr de vouloir supprimer cette vente?',
  deleteProduit: 'Êtes-vous sûr de vouloir supprimer ce produit?',
  deleteCategorie: 'Êtes-vous sûr de vouloir supprimer cette catégorie?',
  deleteClient: 'Êtes-vous sûr de vouloir supprimer ce client?',
  deleteBoutique: 'Êtes-vous sûr de vouloir supprimer cette boutique?',
  deleteUser: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
  deleteTransaction: 'Êtes-vous sûr de vouloir supprimer cette transaction?',

  cancelVente: 'Annuler cette vente? Les données saisies seront perdues.',
  cancelEdit: 'Annuler les modifications?',

  confirmPrintAll: 'Imprimer tous les éléments sélectionnés?',
  confirmExportAll: 'Exporter toutes les données?',

  stockNegative: 'Cette opération mettra le stock en négatif. Continuer?',
  prixInferieur: 'Le prix de vente est inférieur au prix d\'achat. Continuer?',
};

/**
 * Fonction helper pour afficher un toast avec gestion d'erreur automatique
 */
export function handleApiResponse<T>(
  promise: Promise<Response>,
  successMessage: () => void,
  errorMessage?: () => void
): Promise<T> {
  return promise
    .then(async (res) => {
      if (res.ok) {
        successMessage();
        return res.json();
      } else {
        const error = await res.json();
        if (errorMessage) {
          errorMessage();
        } else {
          errorMessages.validationError(error.error || error.message);
        }
        throw new Error(error.error || error.message);
      }
    })
    .catch((error) => {
      if (!errorMessage && error.message !== 'Failed to fetch') {
        errorMessages.networkError();
      }
      throw error;
    });
}

/**
 * Dismiss toast par ID ou tous
 */
export const dismissToast = (toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};
