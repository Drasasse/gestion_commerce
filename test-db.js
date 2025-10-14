const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Lister les utilisateurs
    const users = await prisma.user.findMany({
      include: {
        boutique: true
      }
    });
    
    console.log(`\n📊 Nombre d'utilisateurs trouvés: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Utilisateurs:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        console.log(`   Boutique: ${user.boutique ? user.boutique.nom : 'Aucune'}`);
        console.log(`   Mot de passe hashé: ${user.password ? 'Oui' : 'Non'}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
    }
    
    // Test de la table Transaction pour voir si elle existe
    try {
      const transactionCount = await prisma.transaction.count();
      console.log(`📈 Nombre de transactions: ${transactionCount}`);
    } catch (error) {
      console.log('❌ Erreur lors de l\'accès aux transactions:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();