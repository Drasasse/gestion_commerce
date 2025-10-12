/**
 * Script de test pour la création de catégories
 * Test avec les comptes gestionnaires créés dans seed.ts
 */

const BASE_URL = 'http://localhost:3000';

async function testCategoryCreation() {
  console.log('🧪 Test de création de catégories\n');

  // Test 1: Connexion gestionnaire
  console.log('1. Test de connexion gestionnaire...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'fatou@demo.com',
        password: 'gest123'
      })
    });

    console.log('Status connexion:', loginResponse.status);
    console.log('Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.ok) {
      console.log('✅ Connexion réussie');
    } else {
      console.log('❌ Échec de connexion');
      const errorText = await loginResponse.text();
      console.log('Erreur:', errorText);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }

  console.log('\n2. Test de récupération des catégories...');
  try {
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    console.log('Status catégories:', categoriesResponse.status);
    
    if (categoriesResponse.ok) {
      const data = await categoriesResponse.json();
      console.log('✅ Catégories récupérées:', data.categories?.length || 0);
    } else {
      console.log('❌ Échec récupération catégories');
      const errorText = await categoriesResponse.text();
      console.log('Erreur:', errorText);
    }
  } catch (error) {
    console.log('❌ Erreur récupération catégories:', error.message);
  }

  console.log('\n3. Test de création de catégorie...');
  try {
    const createResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Test Catégorie ' + Date.now(),
        description: 'Catégorie de test créée automatiquement'
      })
    });

    console.log('Status création:', createResponse.status);
    
    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('✅ Catégorie créée:', data);
    } else {
      console.log('❌ Échec création catégorie');
      const errorText = await createResponse.text();
      console.log('Erreur:', errorText);
    }
  } catch (error) {
    console.log('❌ Erreur création catégorie:', error.message);
  }

  console.log('\n4. Test d\'accès à la page catégories...');
  try {
    const pageResponse = await fetch(`${BASE_URL}/boutique/categories`);
    console.log('Status page:', pageResponse.status);
    
    if (pageResponse.ok) {
      console.log('✅ Page catégories accessible');
    } else {
      console.log('❌ Page catégories inaccessible');
    }
  } catch (error) {
    console.log('❌ Erreur accès page:', error.message);
  }
}

// Exécuter les tests
testCategoryCreation().catch(console.error);