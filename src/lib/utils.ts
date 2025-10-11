import { DEVISE_PRINCIPALE } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Formate un montant avec la devise principale (FCFA)
 * @param montant - Le montant à formater
 * @param decimales - Nombre de décimales (par défaut 0 pour FCFA)
 * @returns Le montant formaté avec la devise
 * @example formatMontant(50000) // "50 000 FCFA"
 * @example formatMontant(50000.50, 2) // "50 000,50 FCFA"
 */
export function formatMontant(montant: number, decimales: number = 0): string {
  // Format standard international pour FCFA (XOF)
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(montant);

  return `${formatted} ${DEVISE_PRINCIPALE}`;
}

/**
 * Formate un montant en version compacte (pour dashboards)
 * @param montant - Le montant à formater
 * @returns Le montant formaté en compact (ex: 50K, 1,2M)
 * @example formatMontantCompact(50000) // "50K FCFA"
 * @example formatMontantCompact(1200000) // "1,2M FCFA"
 */
export function formatMontantCompact(montant: number): string {
  if (montant >= 1000000) {
    return `${(montant / 1000000).toFixed(1)}M ${DEVISE_PRINCIPALE}`;
  } else if (montant >= 1000) {
    return `${(montant / 1000).toFixed(0)}K ${DEVISE_PRINCIPALE}`;
  }
  return formatMontant(montant);
}

/**
 * Formate une date au format français
 * @param date - La date à formater (string ou Date)
 * @returns La date formatée (ex: 09/10/2025)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
}

/**
 * Formate une date avec l'heure
 * @param date - La date à formater
 * @returns La date et l'heure formatées
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR');
}

/**
 * Calcule la marge bénéficiaire en pourcentage
 * @param prixAchat - Prix d'achat
 * @param prixVente - Prix de vente
 * @returns La marge en pourcentage
 */
export function calculerMarge(prixAchat: number, prixVente: number): number {
  if (prixAchat === 0) return 0;
  return ((prixVente - prixAchat) / prixAchat) * 100;
}

/**
 * Détermine la couleur selon le niveau de stock
 * @param quantite - Quantité en stock
 * @param seuilAlerte - Seuil d'alerte
 * @returns Classes Tailwind pour la couleur
 */
export function getStockColorClasses(quantite: number, seuilAlerte: number): string {
  if (quantite === 0) {
    return 'bg-red-100 text-red-800';
  } else if (quantite <= seuilAlerte) {
    return 'bg-orange-100 text-orange-800';
  }
  return 'bg-green-100 text-green-800';
}

/**
 * Détermine la couleur selon le statut de paiement
 * @param statut - Statut de paiement
 * @returns Classes Tailwind pour la couleur
 */
export function getPaymentStatusColor(statut: 'PAYE' | 'IMPAYE' | 'PARTIEL'): string {
  switch (statut) {
    case 'PAYE':
      return 'bg-green-100 text-green-800';
    case 'IMPAYE':
      return 'bg-red-100 text-red-800';
    case 'PARTIEL':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Génère un numéro de référence aléatoire
 * @param prefix - Préfixe (ex: 'REF', 'FACT')
 * @returns Numéro de référence
 */
export function genererReference(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Valide un numéro de téléphone guinéen
 * @param telephone - Numéro à valider
 * @returns true si valide
 */
export function validerTelephone(telephone: string): boolean {
  // Format: +224 XXX XX XX XX ou 224 XXX XX XX XX ou XXX XX XX XX
  const regex = /^(\+?224)?[0-9]{9}$/;
  return regex.test(telephone.replace(/\s/g, ''));
}

/**
 * Valide une adresse email
 * @param email - Email à valider
 * @returns true si valide
 */
export function validerEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Nettoie et parse un montant saisi par l'utilisateur
 * @param montant - Montant sous forme de string
 * @returns Montant numérique
 */
export function parseMontant(montant: string): number {
  return parseFloat(montant.replace(/[^\d.-]/g, '')) || 0;
}

/**
 * Tronque un texte à une longueur maximum
 * @param texte - Texte à tronquer
 * @param longueur - Longueur maximum
 * @returns Texte tronqué avec ...
 */
export function tronquerTexte(texte: string, longueur: number = 50): string {
  if (texte.length <= longueur) return texte;
  return texte.substring(0, longueur) + '...';
}

/**
 * Combine des classes CSS conditionnelles avec gestion intelligente des conflits Tailwind
 * Utilise clsx pour la logique conditionnelle et tailwind-merge pour résoudre les conflits
 * @param inputs - Classes CSS (string, objet conditionnel, ou tableau)
 * @returns Classes combinées et dédupliquées
 * @example cn('px-2 py-1', condition && 'bg-blue-500', { 'font-bold': isActive })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
