# 🏪 Gestion Commerce - Application de Gestion Commerciale

Application web complète pour la gestion de boutiques multi-sites avec suivi des stocks, ventes, clients et trésorerie.

## 📊 État du Projet

**Version**: 0.1.0 (MVP)
**Status**: ✅ Fonctionnel | ⚠️ Non production-ready
**Score Global**: 5.4/10

> ⚠️ **IMPORTANT**: Cette application nécessite des améliorations de sécurité et de tests avant déploiement en production.
> Consultez [AUDIT_RAPPORT_COMPLET.md](./AUDIT_RAPPORT_COMPLET.md) pour les détails complets.

### 📚 Documentation Complète

- 📊 **[AUDIT_RAPPORT_COMPLET.md](./AUDIT_RAPPORT_COMPLET.md)** - Analyse approfondie de l'application
- 📍 **[ETAT_ACTUEL.md](./ETAT_ACTUEL.md)** - État détaillé du projet (21 pages, 24 API, 18 composants)
- 🚀 **[PLAN_AMELIORATIONS_IMMEDIATE.md](./PLAN_AMELIORATIONS_IMMEDIATE.md)** - Roadmap 8 semaines vers production
- 💡 **[PROPOSITION_AMELIORATIONS.md](./PROPOSITION_AMELIORATIONS.md)** - Suggestions initiales

### ⚡ Améliorations Prioritaires

#### 🔴 CRITIQUE (à faire avant production)
- [ ] Rate limiting (anti brute-force)
- [ ] CSRF protection
- [ ] Tests (0% coverage actuellement)
- [ ] Validation input côté client

#### 🟠 IMPORTANT
- [ ] Redis caching (performances)
- [ ] Design system cohérent
- [ ] Architecture en services/repositories
- [ ] Monitoring & logs professionnels

## 🚀 Fonctionnalités

### Pour l'Administrateur
- **Vue consolidée** de toutes les boutiques
- Gestion des boutiques et utilisateurs
- Suivi du capital injecté et de la trésorerie globale
- Gestion des produits, catégories et stocks
- Rapports et statistiques détaillés
- Suivi des clients et impayés

### Pour les Gestionnaires
- **Vue dédiée** à leur boutique assignée
- Gestion des ventes et de la caisse
- Gestion des produits et stocks
- Suivi des clients et impayés
- Statistiques de performance

## 📦 Stack Technique

### Core
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript 5.7.3 (strict mode)
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS v4.0 + Dark Mode

### Backend
- **API**: Next.js API Routes (24 endpoints)
- **Database**: PostgreSQL
- **ORM**: Prisma 6.2.1 (15 modèles)
- **Auth**: NextAuth 5.0.0 (JWT + Credentials)
- **Validation**: Zod 3.24.1

### Features
- **State Management**: TanStack Query 5.64.5
- **Tables**: Custom responsive tables + virtual scrolling
- **Export**: XLSX (Excel/CSV)
- **Icons**: Lucide React 0.469.0
- **Toasts**: React Hot Toast 2.4.1
- **Theme**: next-themes 0.4.6

### DevOps
- **Hosting**: Vercel
- **Database**: Vercel Postgres / Supabase
- **Version Control**: Git + GitHub

## 🛠️ Installation Locale

### Prérequis
- Node.js 18+
- PostgreSQL (local ou via service cloud)

### Étapes

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer la base de données**

Modifier le fichier `.env` avec vos informations de base de données :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gestion_commerce"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-securise"
```

3. **Initialiser la base de données**
```bash
npm run db:push
npm run db:seed
```

4. **Lancer l'application**
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🚢 Déploiement sur Vercel

### Option 1 : Utiliser Vercel Postgres (Recommandé)

1. **Créer un compte sur Vercel** : [vercel.com](https://vercel.com)

2. **Installer Vercel CLI**
```bash
npm install -g vercel
```

3. **Se connecter à Vercel**
```bash
vercel login
```

4. **Créer une base de données Postgres**
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Storage → Create Database → Postgres
   - Copier la `DATABASE_URL` fournie

5. **Configurer les variables d'environnement sur Vercel**
   - Dans votre projet Vercel → Settings → Environment Variables
   - Ajouter :
     ```
     DATABASE_URL=<votre-url-vercel-postgres>
     NEXTAUTH_URL=https://votre-app.vercel.app
     NEXTAUTH_SECRET=<générer-avec-openssl-rand-base64-32>
     ```

6. **Déployer**
```bash
vercel
```

7. **Initialiser la base de données en production**
```bash
vercel env pull .env.production
npm run db:push
```

### Option 2 : Utiliser Supabase (Gratuit)

1. **Créer un compte sur Supabase** : [supabase.com](https://supabase.com)

2. **Créer un nouveau projet**
   - Project Settings → Database
   - Copier la `Connection String` (mode "Pooler" pour Vercel)

3. **Configurer sur Vercel** (même processus que ci-dessus)

4. **Déployer**
```bash
vercel
```

## 👤 Comptes de Test

Après le seeding, vous aurez ces comptes :

**Administrateur** (accès complet)
- Email: `admin@demo.com`
- Mot de passe: `admin123`

**Gestionnaire 1** (Boutique Centre-Ville)
- Email: `fatou@demo.com`
- Mot de passe: `gest123`

**Gestionnaire 2** (Boutique Quartier Nord)
- Email: `aminata@demo.com`
- Mot de passe: `gest123`

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- 📱 Mobile (smartphones)
- 💻 Tablettes
- 🖥️ Desktop

## 🔒 Sécurité

- Authentification sécurisée avec NextAuth.js
- Gestion des rôles (ADMIN / GESTIONNAIRE)
- Isolation des données par boutique
- Mots de passe hashés avec bcrypt
- Protection des routes avec middleware

## 📊 Structure de la Base de Données

- **Boutique** : Magasins/Points de vente
- **User** : Utilisateurs (Admin/Gestionnaires)
- **Produit** : Articles en vente
- **Categorie** : Classification des produits
- **Stock** : Inventaire par boutique
- **Client** : Base clients
- **Vente** : Transactions de vente
- **Transaction** : Opérations financières (capital, dépenses, etc.)

## 📝 Scripts Disponibles

```bash
npm run dev          # Lancer en développement
npm run build        # Build pour production
npm run start        # Lancer en production
npm run db:push      # Pousser le schéma Prisma vers la DB
npm run db:seed      # Remplir la DB avec des données de test
npm run db:generate  # Générer le client Prisma
```

## 📊 Métriques du Projet

| Catégorie | Valeur |
|-----------|--------|
| **Lignes de code** | ~10,000+ |
| **Fichiers source** | 81 TS/TSX |
| **Modèles Prisma** | 15 |
| **Routes API** | 24 |
| **Pages** | 21 (13 GESTIONNAIRE + 6 ADMIN + 2 auth) |
| **Composants** | 18 |
| **Dépendances** | 857 npm packages |
| **Bundle size** | ~350kb (à optimiser) |
| **Coverage tests** | 0% (à implémenter) |

## 🎯 Scores de Qualité

| Aspect | Score | Status |
|--------|-------|--------|
| Fonctionnalités | 8/10 | ✅ Complet MVP |
| Code Quality | 6/10 | ⚠️ TypeScript OK, manque tests |
| Sécurité | 4/10 | 🚨 Critiques non résolus |
| Performance | 5/10 | ⚠️ Aucune optimisation |
| UX/UI | 7/10 | ✅ Bon, manque design system |
| Scalabilité | 5/10 | ⚠️ Architecture monolithique |
| Maintenabilité | 5/10 | ⚠️ Duplication code |
| Documentation | 3/10 | ❌ Quasi inexistante |

**Score Global**: **5.4/10** - Bon MVP, pas production-ready

## 🚧 Problèmes Connus

### 🚨 Critiques (Bloquants Production)
1. **Pas de rate limiting** - Vulnérable aux attaques brute-force
2. **Pas de CSRF protection** - Formulaires non sécurisés
3. **0% code coverage** - Aucun test
4. **Pas de validation client** - Erreurs seulement après soumission

### ⚠️ Importants (À Corriger Rapidement)
1. **Pas de caching** - Performances médiocres
2. **Design system incohérent** - Couleurs hardcodées partout
3. **Architecture monolithique** - Logique métier mélangée avec routes
4. **Pas de monitoring** - Logs en console.log

### 📋 Voir [AUDIT_RAPPORT_COMPLET.md](./AUDIT_RAPPORT_COMPLET.md) pour la liste complète

## 🤝 Contributing

Pour contribuer au projet:

1. Lire **[ETAT_ACTUEL.md](./ETAT_ACTUEL.md)** pour comprendre l'architecture
2. Consulter **[PLAN_AMELIORATIONS_IMMEDIATE.md](./PLAN_AMELIORATIONS_IMMEDIATE.md)** pour la roadmap
3. Créer une branche depuis `main`
4. Suivre les conventions TypeScript strictes
5. Ajouter des tests (Vitest)
6. Soumettre une Pull Request

## 📄 Licence

Application propriétaire - Usage interne uniquement

---

**Dernière mise à jour**: 11 Octobre 2025
**Maintenu par**: Équipe Gestion Commerce
**Contact**: [À définir]
