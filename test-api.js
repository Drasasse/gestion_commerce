const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Configuration axios avec gestion des cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables globales pour les tests
let authCookies = '';
let csrfToken = '';
let boutiqueId = '';
let sessionToken = '';

// Fonction pour se connecter et obtenir un token de session
async function login() {
  try {
    console.log('🔐 Tentative de connexion...');
    
    // Récupérer le token CSRF
    const csrfResponse = await axios.get(`${BASE_URL}/api/auth/csrf`);
    csrfToken = csrfResponse.data.csrfToken;
    
    // Extraire les cookies de la réponse CSRF
    const csrfCookies = csrfResponse.headers['set-cookie'];
    if (csrfCookies) {
      authCookies = csrfCookies.join('; ');
    }
    
    console.log('✅ Token CSRF obtenu:', csrfToken);
    
    // Se connecter avec les identifiants de test
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/callback/credentials`,
      {
        email: 'admin@test.com',
        password: 'admin123',
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies,
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      }
    );
    
    // Extraire les nouveaux cookies de session
    const loginCookies = loginResponse.headers['set-cookie'];
    if (loginCookies) {
      authCookies = loginCookies.join('; ');
      
      // Extraire le token de session NextAuth
      const sessionCookie = loginCookies.find(cookie => 
        cookie.includes('next-auth.session-token') || 
        cookie.includes('__Secure-next-auth.session-token')
      );
      
      if (sessionCookie) {
        sessionToken = sessionCookie.split('=')[1].split(';')[0];
        console.log('✅ Token de session extrait');
      }
    }
    
    console.log('✅ Connexion réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Fonction pour tester les endpoints de l'API
async function testAPI() {
  try {
    console.log('\n🧪 Test des endpoints API...');
    
    // Configuration des headers avec authentification
    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    };
    
    // Test de l'endpoint de santé (public)
    console.log('\n📊 Test de l\'endpoint de santé...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, { headers: authHeaders });
    console.log('✅ Santé API:', healthResponse.data);
    
    // Test de l'endpoint des produits (protégé)
    console.log('\n📦 Test de l\'endpoint des produits...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`, { 
        headers: authHeaders,
        withCredentials: true 
      });
      console.log('✅ Produits récupérés:', productsResponse.data.length || 0, 'produits');
    } catch (error) {
      console.log('⚠️ Endpoint produits:', error.response?.status, error.response?.statusText);
    }
    
    // Test de l'endpoint des clients (protégé)
    console.log('\n👥 Test de l\'endpoint des clients...');
    try {
      const clientsResponse = await axios.get(`${BASE_URL}/api/clients`, { 
        headers: authHeaders,
        withCredentials: true 
      });
      console.log('✅ Clients récupérés:', clientsResponse.data.length || 0, 'clients');
    } catch (error) {
      console.log('⚠️ Endpoint clients:', error.response?.status, error.response?.statusText);
    }
    
    // Test de l'endpoint des ventes (protégé)
    console.log('\n💰 Test de l\'endpoint des ventes...');
    try {
      const salesResponse = await axios.get(`${BASE_URL}/api/sales`, { 
        headers: authHeaders,
        withCredentials: true 
      });
      console.log('✅ Ventes récupérées:', salesResponse.data.length || 0, 'ventes');
    } catch (error) {
      console.log('⚠️ Endpoint ventes:', error.response?.status, error.response?.statusText);
    }
    
    // Test de l'endpoint de session (protégé)
    console.log('\n🔐 Test de l\'endpoint de session...');
    try {
      const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`, { 
        headers: authHeaders,
        withCredentials: true 
      });
      console.log('✅ Session:', sessionResponse.data.user ? 'Utilisateur connecté' : 'Pas de session');
    } catch (error) {
      console.log('⚠️ Endpoint session:', error.response?.status, error.response?.statusText);
    }
    
    console.log('\n🎉 Tests API terminés!');
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les boutiques
async function testBoutiques(cookies) {
  try {
    console.log('\n🏪 Test des boutiques...');
    
    // Configuration des headers avec authentification
    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    };
    
    // GET - Récupérer toutes les boutiques
    const boutiquesResponse = await axios.get(`${API_URL}/boutiques`, {
      headers: authHeaders
    });
    
    console.log('✅ Récupération des boutiques:', boutiquesResponse.data.boutiques?.length || 0, 'boutiques trouvées');
    
    // POST - Créer une nouvelle boutique (test)
    const nouvelleBoutique = {
      nom: 'Boutique Test API',
      adresse: '123 Rue de Test',
      telephone: '+33123456789',
      email: 'test@boutique.com'
    };
    
    const createResponse = await axios.post(`${API_URL}/boutiques`, nouvelleBoutique, {
      headers: authHeaders
    });
    
    console.log('📋 Réponse création boutique:', JSON.stringify(createResponse.data, null, 2));
    console.log('✅ Création de boutique réussie:', createResponse.data.boutique?.nom || createResponse.data.nom);
    return createResponse.data.boutique || createResponse.data;
    
  } catch (error) {
    console.error('❌ Erreur test boutiques:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les produits
async function testProduits(cookies, boutiqueId) {
  try {
    console.log('\n📦 Test des produits...');
    
    // GET - Récupérer tous les produits
    const produitsResponse = await axios.get(`${API_URL}/produits?boutiqueId=${boutiqueId}`, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Récupération des produits:', produitsResponse.data.produits?.length || 0, 'produits trouvés');
    
    // Créer d'abord une catégorie si nécessaire
    const categorieResponse = await axios.post(`${API_URL}/categories`, {
      nom: 'Catégorie Test',
      description: 'Catégorie pour les tests API',
      boutiqueId: boutiqueId
    }, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    const categorieId = categorieResponse.data.categorie.id;
    console.log('✅ Catégorie créée:', categorieResponse.data.categorie.nom);
    
    // POST - Créer un nouveau produit
    const nouveauProduit = {
      nom: 'Produit Test API',
      description: 'Description du produit test',
      prix: 29.99,
      categorieId: categorieId
    };
    
    const createProduitResponse = await axios.post(`${API_URL}/produits`, nouveauProduit, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Création de produit réussie:', createProduitResponse.data.produit?.nom);
    return createProduitResponse.data.produit;
    
  } catch (error) {
    console.error('❌ Erreur test produits:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les clients
async function testClients(cookies, boutiqueId) {
  try {
    console.log('\n👥 Test des clients...');
    
    // GET - Récupérer tous les clients
    const clientsResponse = await axios.get(`${API_URL}/clients?boutiqueId=${boutiqueId}`, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Récupération des clients:', clientsResponse.data.clients?.length || 0, 'clients trouvés');
    
    // POST - Créer un nouveau client
    const nouveauClient = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@test.com',
      telephone: '+33987654321',
      adresse: '456 Avenue de Test'
    };
    
    const createClientResponse = await axios.post(`${API_URL}/clients`, nouveauClient, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Création de client réussie:', createClientResponse.data.client?.nom, createClientResponse.data.client?.prenom);
    return createClientResponse.data.client;
    
  } catch (error) {
    console.error('❌ Erreur test clients:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les ventes
async function testVentes(cookies, boutiqueId, clientId, produitId) {
  try {
    console.log('\n💰 Test des ventes...');
    
    // GET - Récupérer toutes les ventes
    const ventesResponse = await axios.get(`${API_URL}/ventes?boutiqueId=${boutiqueId}`, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Récupération des ventes:', ventesResponse.data.ventes?.length || 0, 'ventes trouvées');
    
    // POST - Créer une nouvelle vente
    const nouvelleVente = {
      clientId: clientId,
      lignesVente: [
        {
          produitId: produitId,
          quantite: 2,
          prixUnitaire: 29.99
        }
      ],
      montantPaye: 50.00
    };
    
    const createVenteResponse = await axios.post(`${API_URL}/ventes`, nouvelleVente, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Création de vente réussie:', createVenteResponse.data.vente?.numeroVente);
    return createVenteResponse.data.vente;
    
  } catch (error) {
    console.error('❌ Erreur test ventes:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les transactions
async function testTransactions(cookies, boutiqueId) {
  try {
    console.log('\n💳 Test des transactions...');
    
    // GET - Récupérer toutes les transactions
    const transactionsResponse = await axios.get(`${API_URL}/transactions?boutiqueId=${boutiqueId}`, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Récupération des transactions:', transactionsResponse.data.transactions?.length || 0, 'transactions trouvées');
    
    // POST - Créer une nouvelle transaction
    const nouvelleTransaction = {
      type: 'DEPENSE',
      montant: 100.00,
      description: 'Achat de fournitures de bureau',
      categorieDepense: 'FOURNITURES'
    };
    
    const createTransactionResponse = await axios.post(`${API_URL}/transactions`, nouvelleTransaction, {
      headers: {
        ...headers,
        Cookie: cookies?.join('; ') || ''
      }
    });
    
    console.log('✅ Création de transaction réussie:', createTransactionResponse.data.transaction?.description);
    return createTransactionResponse.data.transaction;
    
  } catch (error) {
    console.error('❌ Erreur test transactions:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction principale pour exécuter tous les tests
async function runTests() {
  console.log('🚀 Démarrage des tests API...');
  console.log('=' .repeat(50));
  
  try {
    // Étape 1: Connexion
    const cookies = await login();
    
    // Étape 2: Test des boutiques
    const boutique = await testBoutiques(cookies);
    const boutiqueId = boutique?.id;
    
    if (!boutiqueId) {
      throw new Error('Impossible de récupérer l\'ID de la boutique');
    }
    
    // Étape 3: Test des produits
    const produit = await testProduits(cookies, boutiqueId);
    
    // Étape 4: Test des clients
    const client = await testClients(cookies, boutiqueId);
    
    // Étape 5: Test des ventes
    if (client?.id && produit?.id) {
      await testVentes(cookies, boutiqueId, client.id, produit.id);
    }
    
    // Étape 6: Test des transactions
    await testTransactions(cookies, boutiqueId);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Tous les tests ont été exécutés avec succès!');
    
  } catch (error) {
    console.error('\n' + '=' .repeat(50));
    console.error('💥 Erreur lors de l\'exécution des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  login,
  testBoutiques,
  testProduits,
  testClients,
  testVentes,
  testTransactions
};