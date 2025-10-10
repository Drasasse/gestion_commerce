// Types centralisés pour l'application Gestion Commerce

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTIONNAIRE';
  boutiqueId: string | null;
  boutique?: Boutique | null;
  createdAt: string;
  updatedAt: string;
}

export interface Boutique {
  id: string;
  nom: string;
  adresse?: string;
  telephone?: string;
  description?: string;
  capitalInitial?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Categorie {
  id: string;
  nom: string;
  description?: string;
  boutiqueId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Produit {
  id: string;
  nom: string;
  description?: string;
  prixAchat: number;
  prixVente: number;
  seuilAlerte: number;
  categorieId: string;
  categorie: Categorie;
  boutiqueId: string;
  quantiteStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  produitId: string;
  produit?: Produit;
  boutiqueId: string;
  quantite: number;
  derniereEntree?: string;
  derniereSortie?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MouvementStock {
  id: string;
  stockId: string;
  stock?: Stock;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  motif?: string;
  venteId?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  boutiqueId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vente {
  id: string;
  numeroVente: string;
  clientId?: string;
  client?: Client;
  boutiqueId: string;
  userId: string;
  user?: Pick<User, 'name'>;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'PAYE' | 'IMPAYE' | 'PARTIEL';
  dateVente: string;
  dateEcheance?: string;
  lignes?: LigneVente[];
  paiements?: Paiement[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface LigneVente {
  id: string;
  venteId: string;
  produitId: string;
  produit?: Pick<Produit, 'nom'>;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  createdAt: string;
}

export interface Paiement {
  id: string;
  venteId: string;
  montant: number;
  methodePaiement: string;
  reference?: string;
  notes?: string;
  dateCreation: string;
}

export interface Transaction {
  id: string;
  type: 'VENTE' | 'ACHAT' | 'DEPENSE' | 'INJECTION_CAPITAL' | 'RETRAIT' | 'RECETTE';
  montant: number;
  description: string;
  boutiqueId: string;
  userId: string;
  user?: Pick<User, 'name'>;
  dateTransaction: string;
  createdAt: string;
}

// Types pour les formulaires
export interface ProduitFormData {
  nom: string;
  description: string;
  prixAchat: string;
  prixVente: string;
  seuilAlerte: string;
  categorieId: string;
}

export interface CategorieFormData {
  nom: string;
  description: string;
}

export interface ClientFormData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  email: string;
}

export interface VenteFormData {
  clientId?: string;
  lignes: {
    produitId: string;
    quantite: number;
    prixUnitaire: number;
  }[];
  montantPaye?: number;
}

export interface TransactionFormData {
  type: Transaction['type'];
  montant: string;
  description: string;
}

// Types pour les réponses API avec pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProduitsResponse {
  produits: Produit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VentesResponse {
  ventes: Vente[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Constantes
export const DEVISES = {
  FCFA: 'FCFA',
  EUR: '€',
  USD: '$',
} as const;

export const DEVISE_PRINCIPALE = DEVISES.FCFA;

export const PAYMENT_STATUS_LABELS = {
  PAYE: 'Payé',
  IMPAYE: 'Impayé',
  PARTIEL: 'Partiel',
} as const;

export const TRANSACTION_TYPE_LABELS = {
  VENTE: 'Vente',
  ACHAT: 'Achat',
  DEPENSE: 'Dépense',
  INJECTION_CAPITAL: 'Injection capital',
  RETRAIT: 'Retrait',
  RECETTE: 'Recette',
} as const;

export const MOUVEMENT_TYPE_LABELS = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
} as const;
