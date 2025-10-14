import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function restoreAdmin() {
  try {
    console.log('🧹 Suppression des données de démonstration...');
    
    // Supprimer toutes les données dans l'ordre correct (à cause des contraintes de clés étrangères)
    await prisma.ligneVente.deleteMany();
    await prisma.ligneCommande.deleteMany();
    await prisma.paiement.deleteMany();
    await prisma.vente.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.mouvementStock.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.client.deleteMany();
    await prisma.fournisseur.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    await prisma.boutique.deleteMany();
    
    console.log('✅ Données de démonstration supprimées');
    
    console.log('👤 Création du compte administrateur original...');
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('Dramane*1210', 12);
    
    // Créer le compte administrateur
    const admin = await prisma.user.create({
      data: {
        name: 'Dramane',
        email: 'mognetise@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        boutiqueId: null
      }
    });
    
    console.log('✅ Compte administrateur créé:', {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
    
    // Tester le mot de passe
    const isPasswordValid = await bcrypt.compare('Dramane*1210', admin.password);
    console.log('🔐 Test du mot de passe:', isPasswordValid ? '✅ Valide' : '❌ Invalide');
    
    console.log('\n🎉 Restauration terminée avec succès !');
    console.log('Vous pouvez maintenant vous connecter avec :');
    console.log('Email: mognetise@gmail.com');
    console.log('Mot de passe: Dramane*1210');
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdmin();