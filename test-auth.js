const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Recherche de tous les utilisateurs...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('👥 Utilisateurs trouvés:', users);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    // Rechercher l'utilisateur mognetise@gmail.com
    const adminUser = await prisma.user.findUnique({
      where: { email: 'mognetise@gmail.com' }
    });

    if (adminUser) {
      console.log('👤 Utilisateur mognetise@gmail.com trouvé:', {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      });

      // Tester le mot de passe
      const isValidPassword = await bcrypt.compare('Dramane*1210', adminUser.password);
      console.log('🔐 Test du mot de passe Dramane*1210:', isValidPassword ? '✅ Valide' : '❌ Invalide');
      
      if (isValidPassword) {
        console.log('🎉 Authentification réussie pour le compte administrateur original !');
      }
    } else {
      console.log('❌ Utilisateur mognetise@gmail.com non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();