# Guide de Résolution des Problèmes d'Authentification

## Problème: Impossible de se connecter avec les comptes créés

### Solution 1: Créer un compte administrateur

Pour créer un compte administrateur fonctionnel, exécutez la commande suivante:

```bash
npm run create-admin
```

Vous serez invité à entrer:
- Nom complet
- Email
- Mot de passe (minimum 6 caractères)

Le script va:
- Hasher correctement le mot de passe avec bcrypt
- Créer un compte avec le rôle ADMIN
- Ou mettre à jour un compte existant si l'email existe déjà

### Solution 2: Vérifier les utilisateurs existants

Pour voir la liste de tous les utilisateurs et vérifier si leurs mots de passe sont correctement hashés:

```bash
npm run list-users
```

Ce script affichera:
- Tous les utilisateurs
- Leur rôle (ADMIN/GESTIONNAIRE)
- Leur boutique assignée
- Si leur mot de passe est correctement hashé (commence par $2)

### Solution 3: Réinitialiser un compte existant

Si un utilisateur GESTIONNAIRE ne peut pas se connecter, vous pouvez:

1. Lister les utilisateurs pour trouver son email:
```bash
npm run list-users
```

2. Utiliser le script create-admin avec son email:
```bash
npm run create-admin
```

3. Quand le script détecte que l'email existe, répondez "oui" pour mettre à jour le mot de passe

### Vérifications importantes

✅ **Le mot de passe est haché**: Les mots de passe doivent commencer par `$2a$` ou `$2b$` (bcrypt hash)

❌ **Mot de passe en clair**: Si le mot de passe est stocké en clair dans la base de données, la connexion échouera

### Après la création/réinitialisation

1. Déconnectez-vous complètement de l'application
2. Videz le cache du navigateur ou utilisez le mode navigation privée
3. Essayez de vous connecter avec les nouveaux identifiants

### Compte démo

Le compte démo n'est PAS un vrai compte dans la base de données. Il est configuré dans le code pour permettre les tests. Pour utiliser l'application en production:

1. Créez un vrai compte admin avec `npm run create-admin`
2. Connectez-vous avec ce compte
3. Créez les boutiques et les gestionnaires depuis l'interface admin

### Structure des rôles

- **ADMIN**: Accès complet, peut gérer toutes les boutiques, créer des utilisateurs
- **GESTIONNAIRE**: Accès limité à sa boutique assignée uniquement

### En cas de problème persistant

Si après avoir exécuté ces scripts, vous ne pouvez toujours pas vous connecter:

1. Vérifiez les logs de la console du navigateur (F12)
2. Vérifiez que la variable d'environnement `NEXTAUTH_SECRET` est définie
3. Vérifiez que la base de données est accessible
4. Contactez le support technique avec les logs d'erreur
