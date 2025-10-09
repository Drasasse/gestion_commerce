# Gestion Commerce - Application de Gestion Commerciale

Application web complète pour la gestion de boutiques multi-sites avec suivi des stocks, ventes, clients et trésorerie.

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

## 📦 Technologies Utilisées

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (responsive mobile-first)
- **Backend**: Next.js API Routes
- **Base de données**: PostgreSQL
- **ORM**: Prisma
- **Authentification**: NextAuth.js avec gestion des rôles
- **Déploiement**: Vercel

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

## 📄 Licence

Application propriétaire - Usage interne uniquement
