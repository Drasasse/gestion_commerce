# Documentation des Composants - Storybook

Ce projet utilise Storybook pour documenter et tester les composants réutilisables de l'application de gestion commerce.

## 🚀 Démarrage rapide

### Lancer Storybook en mode développement
```bash
npm run storybook
```

### Construire Storybook pour la production
```bash
npm run build-storybook
```

## 📚 Composants documentés

### Composants UI de base
- **ConfirmDialog** - Dialogue de confirmation avec différents types (danger, warning, info)
- **LoadingSkeleton** - Squelettes de chargement pour différents types de contenu
- **Pagination** - Composant de pagination avec navigation et sélection d'éléments par page
- **ThemeToggle** - Basculement entre thèmes clair, sombre et système
- **ExportButton** - Bouton d'export avec menu déroulant Excel/CSV

### Composants de formulaire
- **AdvancedFilters** - Filtres avancés pour les tableaux
- **GlobalSearch** - Recherche globale
- **SortableHeader** - En-têtes de tableau triables

### Composants mobiles
- **MobileButton** - Boutons optimisés pour mobile
- **MobileInput** - Champs de saisie mobiles
- **MobileModal** - Modales responsives
- **MobileStatsCard** - Cartes de statistiques mobiles

### Composants de données
- **ResponsiveTable** - Tableaux responsives
- **ErrorBoundary** - Gestion d'erreurs React

## 🎨 Thèmes et styles

Storybook est configuré pour supporter :
- **Mode clair/sombre** - Basculement automatique
- **Tailwind CSS** - Tous les styles de l'application
- **Responsive design** - Test sur différentes tailles d'écran

## 📖 Conventions de documentation

### Structure des stories
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import MonComposant from './MonComposant';

const meta = {
  title: 'Components/MonComposant',
  component: MonComposant,
  parameters: {
    layout: 'centered', // ou 'padded', 'fullscreen'
    docs: {
      description: {
        component: 'Description du composant...',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Configuration des contrôles
  },
  args: {
    // Props par défaut
  },
} satisfies Meta<typeof MonComposant>;
```

### Types de stories recommandées
- **Default** - État par défaut du composant
- **Variants** - Différentes variantes (couleurs, tailles, etc.)
- **States** - États spéciaux (loading, error, disabled, etc.)
- **Interactive** - Exemples d'interaction utilisateur

### Descriptions et documentation
- Utilisez des descriptions en français
- Documentez les props importantes
- Ajoutez des exemples d'utilisation
- Incluez les cas d'erreur et états spéciaux

## 🔧 Configuration

### Addons installés
- **@storybook/addon-essentials** - Contrôles, actions, docs
- **@storybook/addon-interactions** - Tests d'interaction
- **@storybook/addon-links** - Navigation entre stories

### Intégration Next.js
- Support complet de Next.js 15
- Import des styles globaux
- Configuration TypeScript
- Support des images et assets statiques

## 📝 Bonnes pratiques

1. **Nommage** - Utilisez des noms descriptifs pour les stories
2. **Organisation** - Groupez les composants par catégorie
3. **Props** - Documentez toutes les props importantes
4. **États** - Créez des stories pour tous les états possibles
5. **Responsive** - Testez sur différentes tailles d'écran
6. **Accessibilité** - Vérifiez l'accessibilité des composants

## 🚀 Déploiement

Pour déployer Storybook :

1. Construire les stories :
   ```bash
   npm run build-storybook
   ```

2. Le dossier `storybook-static` contient les fichiers statiques

3. Déployer sur Vercel, Netlify ou tout hébergeur statique

## 🤝 Contribution

Lors de l'ajout de nouveaux composants :

1. Créez le fichier `.stories.tsx` correspondant
2. Documentez toutes les variantes importantes
3. Ajoutez des descriptions en français
4. Testez sur mobile et desktop
5. Vérifiez l'accessibilité

## 📞 Support

Pour toute question sur la documentation des composants, consultez :
- Les stories existantes comme exemples
- La documentation officielle de Storybook
- Les guidelines de design de l'application