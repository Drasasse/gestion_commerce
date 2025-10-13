import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Configuration de la boutique ===\n');

  try {
    // Vérifier s'il y a déjà des boutiques
    const boutiques = await prisma.boutique.findMany();
    console.log(`Boutiques existantes: ${boutiques.length}`);

    let boutique;
    if (boutiques.length === 0) {
      // Créer une boutique par défaut
      boutique = await prisma.boutique.create({
        data: {
          nom: 'Ma Boutique',
          adresse: '123 Rue du Commerce',
          telephone: '+33 1 23 45 67 89',
          description: 'Boutique de démonstration'
        }
      });
      console.log('✅ Boutique créée:', boutique.nom);
    } else {
      boutique = boutiques[0];
      console.log('✅ Boutique existante:', boutique.nom);
    }

    // Vérifier et mettre à jour l'utilisateur admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (adminUser && !adminUser.boutiqueId) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { boutiqueId: boutique.id }
      });
      console.log('✅ Utilisateur admin associé à la boutique');
    } else if (adminUser) {
      console.log('✅ Utilisateur admin déjà associé à une boutique');
    }

    // Créer quelques catégories de base si elles n'existent pas
    const categories = await prisma.categorie.findMany({
      where: { boutiqueId: boutique.id }
    });

    if (categories.length === 0) {
      await prisma.categorie.createMany({
        data: [
          { nom: 'Électronique', description: 'Appareils électroniques', boutiqueId: boutique.id },
          { nom: 'Vêtements', description: 'Vêtements et accessoires', boutiqueId: boutique.id },
          { nom: 'Alimentation', description: 'Produits alimentaires', boutiqueId: boutique.id }
        ]
      });
      console.log('✅ Catégories de base créées');
    }

    console.log('\n🎉 Configuration terminée avec succès!');
    console.log(`Boutique ID: ${boutique.id}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();