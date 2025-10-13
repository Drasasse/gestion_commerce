import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Liste des utilisateurs ===\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      boutiqueId: true,
      boutique: {
        select: {
          nom: true
        }
      },
      createdAt: true,
      password: true // Pour voir si le mot de passe est hashé
    },
    orderBy: { createdAt: 'desc' }
  });

  if (users.length === 0) {
    console.log('Aucun utilisateur trouvé.');
  } else {
    users.forEach((user: any, index: number) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Boutique: ${user.boutique?.nom || 'N/A'}`);
      console.log(`   Mot de passe hashé: ${user.password ? (user.password.startsWith('$2') ? '✅ Oui' : '❌ Non (problème!)') : '❌ Aucun'}`);
      console.log(`   Créé le: ${user.createdAt.toLocaleDateString()}`);
    });

    console.log(`\n\nTotal: ${users.length} utilisateur(s)`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});
