# Guide de Déploiement sur Vercel

## ✅ Ce qui est déjà fait

- ✅ Code pushé sur GitHub: https://github.com/Drasasse/gestion_commerce
- ✅ Vercel CLI installé
- ✅ Compte Vercel créé et connecté
- ✅ **Base de données Prisma Postgres créée** ✨
- ✅ **Schéma de base de données déployé** ✨
- ✅ **Données de test ajoutées** ✨

**Votre base de données est prête avec les comptes de test !**

## 🚀 Étapes de déploiement (SIMPLIFIÉ)

### 1. Importer le projet sur Vercel

**Via le Dashboard Vercel** (recommandé):

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **"Add New Project"**
3. Sélectionner **"Import Git Repository"**
4. Chercher et sélectionner `Drasasse/gestion_commerce`
5. Cliquer sur **"Import"**

### 2. Configurer les variables d'environnement

Dans votre projet Vercel → **Settings** → **Environment Variables**, ajouter ces 3 variables:

#### Variables requises:

1. **DATABASE_URL**
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TanBpcUNmUThJcFpCZHB1MU5BMzciLCJhcGlfa2V5IjoiMDFLNzRTVjIyV00wM0FDMDAyWlpWV0E3Q0oiLCJ0ZW5hbnRfaWQiOiIwYzgzMmU1Mjk2MzJiYjU2M2JiODFhNDJjYTg5MDMyMTJmYTIyYTY0NmU5MTk0NjUxNTIzYjRmNTZhNWNiMmZlIiwiaW50ZXJuYWxfc2VjcmV0IjoiOWQ1YWU2ZTctOGZjMS00ZmMxLTlkN2ItYzM5ZGRlYjQ1MDQ4In0.dzdH0125c4jf04k0JqONOndbc1YL7hXUOyIfbvYbbPM
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

**Important**: Pour chaque variable, sélectionner les 3 environnements:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Déployer

1. Cliquer sur **"Deploy"**
2. Le déploiement prend environ 2-3 minutes
3. ✅ **C'EST TOUT !** Votre application est en ligne !

### 4. Tester l'application

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
