import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('=== Création du compte Administrateur ===\n');

  const name = await question('Nom complet: ');
  const email = await question('Email: ');
  const password = await question('Mot de passe (min 6 caractères): ');

  if (!name || !email || !password) {
    console.error('\n❌ Tous les champs sont requis!');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ Le mot de passe doit contenir au moins 6 caractères!');
    process.exit(1);
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('\n⚠️  Un utilisateur avec cet email existe déjà.');
      const update = await question('Voulez-vous mettre à jour cet utilisateur en ADMIN? (oui/non): ');

      if (update.toLowerCase() === 'oui' || update.toLowerCase() === 'yes' || update.toLowerCase() === 'o') {
        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashedPassword,
            role: 'ADMIN',
            boutiqueId: null
          }
        });

        console.log('\n✅ Utilisateur mis à jour avec succès!');
        console.log(`Email: ${updatedUser.email}`);
        console.log(`Rôle: ${updatedUser.role}`);
      } else {
        console.log('\n❌ Opération annulée.');
      }
    } else {
      // Créer un nouvel admin
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          boutiqueId: null
        }
      });

      console.log('\n✅ Compte administrateur créé avec succès!');
      console.log(`Email: ${newUser.email}`);
      console.log(`Rôle: ${newUser.role}`);
    }

    console.log('\n✅ Vous pouvez maintenant vous connecter avec ces identifiants.\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
