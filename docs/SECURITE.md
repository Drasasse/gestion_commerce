# 🔐 Système de Sécurité

Ce document décrit le système de sécurité implémenté dans l'application.

## 📋 Table des matières

1. [Rate Limiting](#rate-limiting)
2. [Cache Redis](#cache-redis)
3. [Protection CSRF](#protection-csrf)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)

---

## 🚦 Rate Limiting

### Objectif
Protéger l'application contre les abus et les attaques brute-force.

### Limites configurées

| Endpoint | Limite | Période | Identifiant |
|----------|--------|---------|-------------|
| Login | 5 requêtes | 1 minute | IP |
| APIs générales | 100 requêtes | 1 minute | IP |
| APIs sensibles | 10 requêtes | 1 minute | IP |

### Implémentation

```typescript
import { checkRateLimit, loginRateLimiter } from '@/lib/rate-limit';

// Dans une route API
export async function POST(request: NextRequest) {
  // Vérifier le rate limit
  const { success, response } = await checkRateLimit(
    request,
    loginRateLimiter
  );

  if (!success) {
    return response; // 429 Too Many Requests
  }

  // Continuer le traitement
  // ...
}
```

### Headers de réponse

Chaque réponse inclut des headers informatifs:
- `X-RateLimit-Limit`: Nombre maximum de requêtes
- `X-RateLimit-Remaining`: Requêtes restantes
- `X-RateLimit-Reset`: Date de réinitialisation du compteur

### Blocage d'utilisateur

Pour bloquer temporairement un utilisateur après trop de tentatives échouées:

```typescript
import { blockUser, isUserBlocked, unblockUser } from '@/lib/rate-limit';

// Bloquer pour 30 minutes
await blockUser(userId, 30);

// Vérifier si bloqué
const blocked = await isUserBlocked(userId);

// Débloquer
await unblockUser(userId);
```

---

## 💾 Cache Redis

### Objectif
Améliorer les performances en mettant en cache les données fréquemment accédées.

### TTL recommandés

```typescript
import { CacheTTL } from '@/lib/cache';

// 1 minute - Données changeant fréquemment
CacheTTL.SHORT

// 5 minutes - Données modérément dynamiques
CacheTTL.MEDIUM

// 15 minutes - Données relativement stables
CacheTTL.LONG

// 1 heure - Données très stables
CacheTTL.VERY_LONG

// 24 heures - Données quasi-statiques
CacheTTL.DAY
```

### Utilisation simple

```typescript
import { cached, CachePrefix, CacheTTL, CacheTag } from '@/lib/cache';

// Récupérer ou calculer avec cache automatique
const produits = await cached(
  `${CachePrefix.PRODUITS}:boutique:${boutiqueId}`,
  async () => {
    return await prisma.produit.findMany({
      where: { boutiqueId }
    });
  },
  {
    ttl: CacheTTL.MEDIUM,
    tags: [CacheTag.PRODUITS, `boutique:${boutiqueId}`]
  }
);
```

### Utilisation manuelle

```typescript
import { getCache, setCache, deleteCache } from '@/lib/cache';

// Récupérer
const data = await getCache<Produit[]>('produits:123');

// Stocker
await setCache('produits:123', produits, { ttl: 300 });

// Supprimer
await deleteCache('produits:123');
```

### Invalidation

#### Par clé
```typescript
await deleteCache('produits:123');
```

#### Par tag
```typescript
import { invalidateByTag, CacheTag } from '@/lib/cache';

// Invalider tous les produits
await invalidateByTag(CacheTag.PRODUITS);

// Invalider tous les caches d'une boutique
await invalidateByTag(`boutique:${boutiqueId}`);
```

#### Par pattern
```typescript
import { invalidateByPattern } from '@/lib/cache';

// Invalider tous les caches de produits
await invalidateByPattern('produits:*');
```

### Exemple complet dans une API

```typescript
import { cached, invalidateByTag, CachePrefix, CacheTTL, CacheTag } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const boutiqueId = session.user.boutiqueId;

  // Récupérer avec cache
  const produits = await cached(
    `${CachePrefix.PRODUITS}:${boutiqueId}`,
    async () => {
      return await prisma.produit.findMany({
        where: { boutiqueId },
        include: { categorie: true }
      });
    },
    {
      ttl: CacheTTL.MEDIUM,
      tags: [CacheTag.PRODUITS, `boutique:${boutiqueId}`]
    }
  );

  return NextResponse.json({ produits });
}

export async function POST(request: NextRequest) {
  // Créer un produit
  const produit = await prisma.produit.create({ data });

  // Invalider le cache
  await invalidateByTag(CacheTag.PRODUITS);
  await invalidateByTag(`boutique:${boutiqueId}`);

  return NextResponse.json(produit);
}
```

---

## 🛡️ Protection CSRF

### Objectif
Protéger contre les attaques Cross-Site Request Forgery.

### Fonctionnement

1. **Génération de token**: Un token unique est généré pour chaque session
2. **Stockage**: Le token est stocké dans Redis avec expiration (1h)
3. **Validation**: Chaque requête de mutation doit inclure le token

### Configuration

La protection CSRF est automatique via middleware. Pour les requêtes manuelles:

```typescript
import { fetchWithCsrf, getCsrfTokenHeader } from '@/lib/csrf';

// Récupérer le nom du header
const headerName = getCsrfTokenHeader(); // 'x-csrf-token'

// Faire une requête avec CSRF
const response = await fetchWithCsrf('/api/produits', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Exemptions

Les méthodes suivantes sont exemptées de validation CSRF:
- GET
- HEAD
- OPTIONS

---

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env`:

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 2. Obtenir les clés Upstash

1. Créer un compte sur [Upstash Console](https://console.upstash.com/)
2. Créer une base Redis
3. Copier l'URL REST et le TOKEN REST
4. Ajouter dans `.env`

### 3. Tester la connexion

```typescript
import { testRedisConnection } from '@/lib/redis';

// Dans une route API ou script
const isConnected = await testRedisConnection();
console.log('Redis:', isConnected ? '✅ Connecté' : '❌ Échec');
```

---

## 📝 Utilisation

### Appliquer le rate limiting à une route

```typescript
import { checkRateLimit, sensitiveApiRateLimiter } from '@/lib/rate-limit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier rate limit
  const rateLimitCheck = await checkRateLimit(
    request,
    sensitiveApiRateLimiter
  );

  if (!rateLimitCheck.success) {
    return rateLimitCheck.response;
  }

  // Continuer...
}
```

### Ajouter du cache à une route

```typescript
import { cached, invalidateByTag } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const data = await cached(
    'my-key',
    async () => {
      // Requête base de données
      return await prisma.table.findMany();
    },
    { ttl: 300, tags: ['my-tag'] }
  );

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  // Mutation
  const result = await prisma.table.create({ data });

  // Invalider cache
  await invalidateByTag('my-tag');

  return NextResponse.json(result);
}
```

---

## 🔍 Monitoring

### Voir les clés Redis

Via Upstash Console ou Redis CLI:

```bash
# Lister toutes les clés de rate limit
KEYS ratelimit:*

# Lister tous les caches
KEYS cache:*

# Lister tous les tokens CSRF
KEYS csrf:*
```

### Métriques

Le rate limiter Upstash fournit des analytics automatiques accessibles dans:
- [Upstash Console](https://console.upstash.com/)
- Section "Analytics" de votre base Redis

---

## 🚨 Sécurité

### Bonnes pratiques

✅ **À FAIRE**:
- Toujours valider les inputs côté serveur ET client
- Utiliser HTTPS en production
- Configurer `NEXTAUTH_URL` avec HTTPS
- Limiter les tentatives de login
- Logger les tentatives échouées
- Monitorer les anomalies

❌ **À NE PAS FAIRE**:
- Exposer les tokens Redis dans les logs
- Désactiver le rate limiting en production
- Utiliser les mêmes clés Redis dev/prod
- Stocker des données sensibles en cache sans encryption
- Ignorer les erreurs de validation

### Variables sensibles

Les variables suivantes doivent rester **SECRÈTES**:
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`

Ne jamais:
- Les commiter dans Git
- Les afficher dans les logs
- Les envoyer côté client

---

## 📚 Ressources

- [Upstash Documentation](https://docs.upstash.com/)
- [Rate Limiting Guide](https://docs.upstash.com/redis/features/ratelimiting)
- [OWASP CSRF](https://owasp.org/www-community/attacks/csrf)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Rate_Limiting)

---

## 🤝 Support

Pour toute question sur la sécurité:
1. Consulter cette documentation
2. Vérifier les logs application
3. Consulter les métriques Upstash
4. Créer une issue GitHub si nécessaire
