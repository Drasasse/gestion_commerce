const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test simple des endpoints publics
async function testPublicEndpoints() {
  console.log('🚀 Test des endpoints publics...');
  
  try {
    // Test de l'endpoint de santé
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.log('❌ Erreur health check:', error.response?.status, error.response?.statusText);
  }
  
  try {
    // Test de l'endpoint CSRF
    const csrfResponse = await axios.get(`${BASE_URL}/api/auth/csrf`);
    console.log('✅ CSRF token:', csrfResponse.status, csrfResponse.data.csrfToken?.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Erreur CSRF:', error.response?.status, error.response?.statusText);
  }
}

// Test des endpoints protégés (sans authentification)
async function testProtectedEndpoints() {
  console.log('\n🔒 Test des endpoints protégés (sans auth)...');
  
  const endpoints = [
    '/boutiques',
    '/produits',
    '/clients',
    '/ventes',
    '/transactions'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`);
      console.log(`✅ ${endpoint}:`, response.status, 'Données reçues');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`🔒 ${endpoint}: Correctement protégé (${error.response.status})`);
      } else {
        console.log(`❌ ${endpoint}: Erreur inattendue (${error.response?.status})`);
      }
    }
  }
}

// Test de la structure de la base de données
async function testDatabaseStructure() {
  console.log('\n📊 Vérification de la structure de la base de données...');
  
  // Ici on pourrait ajouter des tests directs avec Prisma si nécessaire
  console.log('ℹ️  Pour tester la DB, utilisez: npx prisma studio');
}

// Fonction principale
async function runTests() {
  console.log('=========================================');
  console.log('🧪 TESTS API - GESTION COMMERCE');
  console.log('=========================================\n');
  
  try {
    await testPublicEndpoints();
    await testProtectedEndpoints();
    await testDatabaseStructure();
    
    console.log('\n=========================================');
    console.log('✅ Tests terminés avec succès!');
    console.log('=========================================');
  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();