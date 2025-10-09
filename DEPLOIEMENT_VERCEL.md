# Guide de Déploiement sur Vercel

## ✅ Ce qui est déjà fait

- ✅ Code pushé sur GitHub: https://github.com/Drasasse/gestion_commerce
- ✅ Vercel CLI installé
- ✅ Compte Vercel créé et connecté
- ✅ Base de données Vercel créée

## 🚀 Étapes de déploiement

### 1. Importer le projet sur Vercel

**Via le Dashboard Vercel** (recommandé):

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **"Add New Project"**
3. Sélectionner **"Import Git Repository"**
4. Chercher et sélectionner `Drasasse/gestion_commerce`
5. Cliquer sur **"Import"**

### 2. Configurer la base de données Postgres

1. Dans votre projet Vercel, aller dans **Storage** (onglet en haut)
2. Cliquer sur **"Create Database"**
3. Sélectionner **"Postgres"**
4. Donner un nom (ex: `gestion-commerce-db`)
5. Sélectionner la région (choisir la plus proche)
6. Cliquer sur **"Create"**

### 3. Connecter la base de données au projet

1. Une fois la base créée, aller dans l'onglet **".env.local"**
2. Copier la variable `POSTGRES_PRISMA_URL` ou `DATABASE_URL`
3. Elle ressemble à: `postgres://...@...vercel-storage.com/...`

### 4. Configurer les variables d'environnement

Dans votre projet Vercel → **Settings** → **Environment Variables**, ajouter:

#### Variables requises:

1. **DATABASE_URL**
   ```
   Coller l'URL Postgres copiée à l'étape 3
   ```

2. **NEXTAUTH_URL**
   ```
   https://votre-projet.vercel.app
   ```
   ⚠️ Remplacer `votre-projet` par le nom de votre projet Vercel
   (Vous pouvez le trouver dans Settings → Domains)

3. **NEXTAUTH_SECRET**
   ```
   lJ7F1WS2VjiwYzbgYzPlvyxiENX+fxv2+Ecr90BDJDo=
   ```
   ⚠️ Ce secret a été généré pour vous. Gardez-le confidentiel !

**Important**: Pour chaque variable, sélectionner les 3 environnements:
- ✅ Production
- ✅ Preview
- ✅ Development

### 5. Déployer

1. Retourner dans l'onglet **"Deployments"**
2. Cliquer sur **"Deploy"** ou attendre le déploiement automatique
3. Le déploiement prend environ 2-3 minutes

### 6. Initialiser la base de données

Une fois déployé, il faut créer les tables et ajouter les données de test.

**Option A: Via Vercel CLI** (recommandé)

```bash
# Se connecter à Vercel
vercel login

# Lier le projet local
vercel link

# Télécharger les variables d'environnement
vercel env pull .env.production

# Pousser le schéma vers la base de données
npx prisma db push

# Ajouter les données de test (optionnel mais recommandé)
npx prisma db seed
```

**Option B: Via l'interface Vercel**

1. Aller dans **Storage** → Votre base de données Postgres
2. Cliquer sur **"Query"** ou **"Data"**
3. Exécuter manuellement les migrations (plus complexe, option A recommandée)

### 7. Tester l'application

1. Aller sur votre URL: `https://votre-projet.vercel.app`
2. Vous devriez être redirigé vers `/login`
3. Utiliser les comptes de test:

**Administrateur:**
- Email: `admin@demo.com`
- Mot de passe: `admin123`

**Gestionnaire 1:**
- Email: `fatou@demo.com`
- Mot de passe: `gest123`

**Gestionnaire 2:**
- Email: `aminata@demo.com`
- Mot de passe: `gest123`

## 🔧 Commandes utiles

```bash
# Déployer manuellement depuis le terminal
vercel --prod

# Voir les logs en temps réel
vercel logs

# Redéployer après modifications
git add .
git commit -m "Description des modifications"
git push

# Vercel redéploiera automatiquement !
```

## ⚠️ Points importants

1. **BLOB_READ_WRITE_TOKEN**: Ce token n'est PAS nécessaire pour cette application. C'est pour Vercel Blob Storage (stockage de fichiers), pas pour Postgres.

2. **Redéploiements automatiques**: Chaque fois que vous poussez du code sur GitHub, Vercel redéploie automatiquement.

3. **Preview deployments**: Chaque branche/PR crée un déploiement de preview avec une URL unique.

4. **Domaine personnalisé**: Vous pouvez ajouter votre propre domaine dans Settings → Domains.

## 🐛 Résolution de problèmes

### Erreur: "Prisma Client not found"
```bash
# Depuis le projet local
vercel env pull
npx prisma generate
git add .
git commit -m "Add prisma client"
git push
```

### Erreur: "Can't reach database"
- Vérifier que `DATABASE_URL` est bien configurée dans les variables d'environnement
- S'assurer que l'URL contient `?pgbouncer=true` si vous utilisez le pooling

### Page blanche ou erreur 500
- Voir les logs: `vercel logs` ou dans le Dashboard → Deployments → [votre deploy] → Logs
- Vérifier que toutes les variables d'environnement sont définies

## 📱 Accès mobile

L'application est responsive et fonctionne parfaitement sur mobile !
Vous pouvez ajouter un raccourci sur l'écran d'accueil pour une expérience app-like.

## 🎉 Félicitations !

Votre application est maintenant en ligne et accessible à vos gestionnaires !

---

**Besoin d'aide ?** Consultez la documentation Vercel: https://vercel.com/docs
