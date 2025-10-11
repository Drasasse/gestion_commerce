/**
 * Script de test pour vérifier la connexion Redis
 * Usage: npm run test:redis
 */

import 'dotenv/config';
import { testRedisConnection, redis } from '../src/lib/redis';
import { loginRateLimiter, apiRateLimiter } from '../src/lib/rate-limit';
import { setCache, getCache, deleteCache, cached } from '../src/lib/cache';

async function main() {
  console.log('🧪 Test de connexion Redis\n');

  // Test 1: Connexion basique
  console.log('1️⃣  Test de connexion...');
  const isConnected = await testRedisConnection();
  if (!isConnected) {
    console.error('❌ Impossible de se connecter à Redis');
    console.error('Vérifiez vos variables d\'environnement:');
    console.error('- UPSTASH_REDIS_REST_URL');
    console.error('- UPSTASH_REDIS_REST_TOKEN');
    process.exit(1);
  }

  // Test 2: Opérations basiques
  console.log('\n2️⃣  Test des opérations basiques...');
  try {
    // SET
    await redis.set('test:key', 'test-value', { ex: 10 });
    console.log('   ✅ SET réussi');

    // GET
    const value = await redis.get('test:key');
    if (value === 'test-value') {
      console.log('   ✅ GET réussi');
    } else {
      console.error('   ❌ GET échoué - valeur incorrecte:', value);
    }

    // DELETE
    await redis.del('test:key');
    const deletedValue = await redis.get('test:key');
    if (deletedValue === null) {
      console.log('   ✅ DELETE réussi');
    } else {
      console.error('   ❌ DELETE échoué - valeur encore présente');
    }
  } catch (error) {
    console.error('   ❌ Erreur lors des opérations basiques:', error);
  }

  // Test 3: Rate Limiting
  console.log('\n3️⃣  Test du rate limiting...');
  try {
    const testIp = 'test-ip-' + Date.now();

    // Test avec API rate limiter (100 req/min)
    let successCount = 0;
    for (let i = 0; i < 3; i++) {
      const { success } = await apiRateLimiter.limit(testIp);
      if (success) successCount++;
    }

    if (successCount === 3) {
      console.log('   ✅ Rate limiting fonctionnel');
      console.log(`   📊 ${successCount}/3 requêtes autorisées`);
    } else {
      console.error('   ❌ Rate limiting non fonctionnel');
    }
  } catch (error) {
    console.error('   ❌ Erreur lors du test rate limiting:', error);
  }

  // Test 4: Cache
  console.log('\n4️⃣  Test du système de cache...');
  try {
    const testKey = 'test:cache:' + Date.now();
    const testData = { foo: 'bar', timestamp: Date.now() };

    // SET Cache
    await setCache(testKey, testData, { ttl: 10 });
    console.log('   ✅ Cache SET réussi');

    // GET Cache
    const cachedData = await getCache(testKey);
    if (cachedData && JSON.stringify(cachedData) === JSON.stringify(testData)) {
      console.log('   ✅ Cache GET réussi');
    } else {
      console.error('   ❌ Cache GET échoué');
    }

    // Fonction cached()
    let fetchCount = 0;
    const testFetcher = async () => {
      fetchCount++;
      return { data: 'test', count: fetchCount };
    };

    const result1 = await cached('test:cached', testFetcher, { ttl: 10 });
    const result2 = await cached('test:cached', testFetcher, { ttl: 10 });

    if (result1.count === 1 && result2.count === 1) {
      console.log('   ✅ Fonction cached() réussie (1 seul fetch)');
    } else {
      console.error('   ❌ Fonction cached() échouée (fetch multiple)');
    }

    // DELETE Cache
    await deleteCache(testKey);
    await deleteCache('test:cached');
    console.log('   ✅ Cache DELETE réussi');
  } catch (error) {
    console.error('   ❌ Erreur lors du test cache:', error);
  }

  // Test 5: Performance
  console.log('\n5️⃣  Test de performance...');
  try {
    const iterations = 100;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      await redis.set(`perf:test:${i}`, `value-${i}`, { ex: 10 });
    }

    const duration = Date.now() - start;
    const avgTime = duration / iterations;

    console.log(`   ✅ ${iterations} opérations en ${duration}ms`);
    console.log(`   📊 Moyenne: ${avgTime.toFixed(2)}ms/opération`);

    // Cleanup
    for (let i = 0; i < iterations; i++) {
      await redis.del(`perf:test:${i}`);
    }
  } catch (error) {
    console.error('   ❌ Erreur lors du test performance:', error);
  }

  // Résumé
  console.log('\n✨ Tous les tests sont terminés!\n');
  console.log('📝 Vérifiez les résultats ci-dessus.');
  console.log('📊 Consultez aussi Upstash Console pour voir les métriques:');
  console.log('   https://console.upstash.com/\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
