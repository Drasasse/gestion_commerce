import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Début du seeding...')

  // Créer l'admin
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Administrateur',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  })
  console.log('✓ Admin créé')

  // Créer des boutiques
  const boutique1 = await prisma.boutique.create({
    data: {
      nom: 'Boutique Centre-Ville',
      adresse: 'Avenue principale, Conakry',
      telephone: '+224 622 00 00 01',
      description: 'Boutique principale située au centre-ville',
    },
  })

  const boutique2 = await prisma.boutique.create({
    data: {
      nom: 'Boutique Quartier Nord',
      adresse: 'Quartier Hamdallaye, Conakry',
      telephone: '+224 622 00 00 02',
      description: 'Boutique secondaire au nord',
    },
  })
  console.log('✓ Boutiques créées')

  // Créer des gestionnaires
  const hashedPasswordGest = await bcrypt.hash('gest123', 10)
  const gestionnaire1 = await prisma.user.create({
    data: {
      email: 'fatou@demo.com',
      name: 'Fatou Diallo',
      password: hashedPasswordGest,
      role: 'GESTIONNAIRE',
      boutiqueId: boutique1.id,
    },
  })

  const gestionnaire2 = await prisma.user.create({
    data: {
      email: 'aminata@demo.com',
      name: 'Aminata Camara',
      password: hashedPasswordGest,
      role: 'GESTIONNAIRE',
      boutiqueId: boutique2.id,
    },
  })
  console.log('✓ Gestionnaires créés')

  // Créer des catégories pour boutique 1
  const categorie1_1 = await prisma.categorie.create({
    data: {
      nom: 'Alimentation',
      description: 'Produits alimentaires',
      boutiqueId: boutique1.id,
    },
  })

  const categorie1_2 = await prisma.categorie.create({
    data: {
      nom: 'Boissons',
      description: 'Boissons diverses',
      boutiqueId: boutique1.id,
    },
  })

  const categorie1_3 = await prisma.categorie.create({
    data: {
      nom: 'Hygiène',
      description: 'Produits d\'hygiène',
      boutiqueId: boutique1.id,
    },
  })

  // Créer des catégories pour boutique 2
  const categorie2_1 = await prisma.categorie.create({
    data: {
      nom: 'Alimentation',
      description: 'Produits alimentaires',
      boutiqueId: boutique2.id,
    },
  })

  const categorie2_2 = await prisma.categorie.create({
    data: {
      nom: 'Boissons',
      description: 'Boissons diverses',
      boutiqueId: boutique2.id,
    },
  })
  console.log('✓ Catégories créées')

  // Créer des produits pour boutique 1
  const produits1 = [
    {
      nom: 'Riz Parfumé 50kg',
      description: 'Riz de qualité supérieure',
      prixAchat: 180000,
      prixVente: 200000,
      seuilAlerte: 5,
      categorieId: categorie1_1.id,
      boutiqueId: boutique1.id,
    },
    {
      nom: 'Huile végétale 5L',
      description: 'Huile de cuisine',
      prixAchat: 25000,
      prixVente: 30000,
      seuilAlerte: 10,
      categorieId: categorie1_1.id,
      boutiqueId: boutique1.id,
    },
    {
      nom: 'Coca Cola 50cl (carton)',
      description: 'Carton de 24 bouteilles',
      prixAchat: 12000,
      prixVente: 15000,
      seuilAlerte: 5,
      categorieId: categorie1_2.id,
      boutiqueId: boutique1.id,
    },
    {
      nom: 'Eau minérale 1.5L (pack)',
      description: 'Pack de 6 bouteilles',
      prixAchat: 3000,
      prixVente: 4000,
      seuilAlerte: 10,
      categorieId: categorie1_2.id,
      boutiqueId: boutique1.id,
    },
    {
      nom: 'Savon de toilette',
      description: 'Savon parfumé',
      prixAchat: 500,
      prixVente: 1000,
      seuilAlerte: 20,
      categorieId: categorie1_3.id,
      boutiqueId: boutique1.id,
    },
  ]

  for (const produitData of produits1) {
    const produit = await prisma.produit.create({
      data: produitData,
    })

    // Créer un stock initial
    await prisma.stock.create({
      data: {
        produitId: produit.id,
        boutiqueId: boutique1.id,
        quantite: Math.floor(Math.random() * 50) + 10,
      },
    })
  }

  // Créer des produits pour boutique 2
  const produits2 = [
    {
      nom: 'Riz Parfumé 50kg',
      description: 'Riz de qualité supérieure',
      prixAchat: 180000,
      prixVente: 200000,
      seuilAlerte: 5,
      categorieId: categorie2_1.id,
      boutiqueId: boutique2.id,
    },
    {
      nom: 'Sucre 50kg',
      description: 'Sucre cristallisé',
      prixAchat: 120000,
      prixVente: 135000,
      seuilAlerte: 5,
      categorieId: categorie2_1.id,
      boutiqueId: boutique2.id,
    },
    {
      nom: 'Jus Cocktail 1L',
      description: 'Jus de fruits',
      prixAchat: 2000,
      prixVente: 3000,
      seuilAlerte: 15,
      categorieId: categorie2_2.id,
      boutiqueId: boutique2.id,
    },
  ]

  for (const produitData of produits2) {
    const produit = await prisma.produit.create({
      data: produitData,
    })

    await prisma.stock.create({
      data: {
        produitId: produit.id,
        boutiqueId: boutique2.id,
        quantite: Math.floor(Math.random() * 50) + 10,
      },
    })
  }
  console.log('✓ Produits et stocks créés')

  // Créer des clients pour boutique 1
  await prisma.client.createMany({
    data: [
      {
        nom: 'Diallo',
        prenom: 'Mamadou',
        telephone: '+224 622 11 11 11',
        adresse: 'Conakry',
        boutiqueId: boutique1.id,
      },
      {
        nom: 'Bah',
        prenom: 'Aissatou',
        telephone: '+224 622 22 22 22',
        adresse: 'Conakry',
        boutiqueId: boutique1.id,
      },
    ],
  })

  // Créer des clients pour boutique 2
  await prisma.client.createMany({
    data: [
      {
        nom: 'Camara',
        prenom: 'Ibrahim',
        telephone: '+224 622 33 33 33',
        adresse: 'Conakry',
        boutiqueId: boutique2.id,
      },
    ],
  })
  console.log('✓ Clients créés')

  // Créer des transactions (injection de capital)
  await prisma.transaction.createMany({
    data: [
      {
        type: 'INJECTION_CAPITAL',
        montant: 5000000,
        description: 'Capital initial Boutique Centre-Ville',
        boutiqueId: boutique1.id,
        userId: admin.id,
      },
      {
        type: 'INJECTION_CAPITAL',
        montant: 3000000,
        description: 'Capital initial Boutique Quartier Nord',
        boutiqueId: boutique2.id,
        userId: admin.id,
      },
    ],
  })
  console.log('✓ Transactions créées')

  console.log('\n✅ Seeding terminé avec succès!')
  console.log('\n📝 Comptes de test:')
  console.log('   Admin: admin@demo.com / admin123')
  console.log('   Gestionnaire 1: fatou@demo.com / gest123 (Boutique Centre-Ville)')
  console.log('   Gestionnaire 2: aminata@demo.com / gest123 (Boutique Quartier Nord)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
