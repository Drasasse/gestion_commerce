# 🚀 Démarrage Rapide - Déploiement en 5 minutes

## ✅ Tout est prêt !

- ✅ Code sur GitHub: https://github.com/Drasasse/gestion_commerce
- ✅ Base de données Prisma Postgres configurée
- ✅ Tables créées et données de test ajoutées
- ✅ 3 comptes utilisateurs prêts

## 📋 3 étapes pour déployer

### 1️⃣ Importer sur Vercel (2 min)

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New Project** → **Import Git Repository**
3. Sélectionner `Drasasse/gestion_commerce`
4. Cliquer sur **Import**

### 2️⃣ Configurer 3 variables d'environnement (2 min)

Dans **Settings** → **Environment Variables**, ajouter:

**1. DATABASE_URL:**
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TanBpcUNmUThJcFpCZHB1MU5BMzciLCJhcGlfa2V5IjoiMDFLNzRTVjIyV00wM0FDMDAyWlpWV0E3Q0oiLCJ0ZW5hbnRfaWQiOiIwYzgzMmU1Mjk2MzJiYjU2M2JiODFhNDJjYTg5MDMyMTJmYTIyYTY0NmU5MTk0NjUxNTIzYjRmNTZhNWNiMmZlIiwiaW50ZXJuYWxfc2VjcmV0IjoiOWQ1YWU2ZTctOGZjMS00ZmMxLTlkN2ItYzM5ZGRlYjQ1MDQ4In0.dzdH0125c4jf04k0JqONOndbc1YL7hXUOyIfbvYbbPM
```

**2. NEXTAUTH_URL:**
```
https://VOTRE-PROJET.vercel.app
```
⚠️ Remplacer `VOTRE-PROJET` par le nom affiché dans Vercel

**3. NEXTAUTH_SECRET:**
```
lJ7F1WS2VjiwYzbgYzPlvyxiENX+fxv2+Ecr90BDJDo=
```

✅ Cocher les 3 environnements (Production, Preview, Development) pour chaque variable

### 3️⃣ Déployer (1 min)

1. Cliquer sur **Deploy**
2. Attendre 2-3 minutes
3. ✅ **TERMINÉ !**

## 🎯 Tester l'application

Aller sur votre URL: `https://votre-projet.vercel.app`

**Comptes de test:**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Administrateur** | admin@demo.com | admin123 |
| **Gestionnaire 1** (Centre-Ville) | fatou@demo.com | gest123 |
| **Gestionnaire 2** (Quartier Nord) | aminata@demo.com | gest123 |

## 📱 Accès mobile

L'application est 100% responsive ! Vos gestionnaires peuvent l'utiliser sur leurs smartphones.

## 📊 Ce que vous pouvez faire maintenant

### En tant qu'Admin (admin@demo.com)
- ✅ Voir le tableau de bord consolidé des 2 boutiques
- ✅ Voir tous les produits et stocks
- ✅ Voir toutes les ventes
- ✅ Alertes stock faible

### En tant que Gestionnaire (fatou@demo.com ou aminata@demo.com)
- ✅ Voir uniquement leur boutique
- ✅ Dashboard avec KPIs
- ✅ Produits et stocks de leur boutique
- ✅ Ventes récentes
- ✅ Alertes impayés

## 🔄 Modifications futures

Pour modifier l'application:
```bash
# Faire vos modifications localement
git add .
git commit -m "Description"
git push
```
→ Vercel redéploie automatiquement !

## 📚 Documentation complète

- [README.md](./README.md) - Documentation technique
- [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) - Guide détaillé
- [PROCHAINES_ETAPES.md](./PROCHAINES_ETAPES.md) - Fonctionnalités à ajouter

## 🆘 Problèmes ?

**L'application ne se connecte pas:**
- Vérifier que les 3 variables d'environnement sont bien configurées
- Vérifier que `NEXTAUTH_URL` correspond à votre URL Vercel

**Voir les logs:**
```bash
vercel logs
```
Ou dans Vercel Dashboard → Deployments → [votre deploy] → Logs

---

**C'est tout ! Votre application est en ligne. 🎉**
