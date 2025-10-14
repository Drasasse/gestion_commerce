import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour les produits
const produitSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  prixAchat: z.number().positive('Le prix d\'achat doit être positif'),
  prixVente: z.number().positive('Le prix de vente doit être positif'),
  seuilAlerte: z.number().int().min(0, 'Le seuil d\'alerte doit être positif'),
  categorieId: z.string().min(1, 'La catégorie est requise'),
});

// GET - Récupérer un produit spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const produit = await prisma.produit.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        categorie: true,
        stocks: {
          where: { boutiqueId: session.user.boutiqueId },
          select: { quantite: true },
        },
      },
    });

    if (!produit) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Ajouter la quantité en stock
    const produitAvecStock = {
      ...produit,
      quantiteStock: produit.stocks[0]?.quantite || 0,
      stocks: undefined, // Retirer le tableau stocks de la réponse
    };

    return NextResponse.json(produitAvecStock);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un produit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = produitSchema.parse(body);

    // Vérifier que le produit existe et appartient à la boutique
    const produitExistant = await prisma.produit.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!produitExistant) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que la catégorie appartient à la boutique
    const categorie = await prisma.categorie.findFirst({
      where: {
        id: validatedData.categorieId,
        boutiqueId: session.user.boutiqueId,
      },
    });

    if (!categorie) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    const produitMisAJour = await prisma.produit.update({
      where: { id },
      data: validatedData,
      include: {
        categorie: true,
        stocks: {
          where: { boutiqueId: session.user.boutiqueId },
          select: { quantite: true },
        },
      },
    });

    // Ajouter la quantité en stock
    const produitAvecStock = {
      ...produitMisAJour,
      quantiteStock: produitMisAJour.stocks[0]?.quantite || 0,
      stocks: undefined,
    };

    return NextResponse.json(produitAvecStock);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour du produit:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un produit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.boutiqueId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier que le produit existe et appartient à la boutique
    const produit = await prisma.produit.findFirst({
      where: {
        id,
        boutiqueId: session.user.boutiqueId,
      },
      include: {
        lignesVente: true,
      },
    });

    if (!produit) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le produit a des ventes associées
    if (produit.lignesVente.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un produit qui a des ventes associées' },
        { status: 400 }
      );
    }

    // Supprimer le produit (les stocks et mouvements seront supprimés automatiquement grâce à onDelete: Cascade)
    await prisma.produit.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Produit supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}