# 📚 Guide Storybook & CI/CD - Gestion Commerce

Ce guide vous explique comment utiliser la nouvelle infrastructure de documentation et d'intégration continue mise en place pour votre application de gestion commerce.

## 🎯 Ce qui a été implémenté

### ✅ 1. Storybook - Documentation des composants
- **Configuration complète** de Storybook pour Next.js 15
- **Support Tailwind CSS** et thèmes clair/sombre
- **Stories créées** pour les composants principaux :
  - `ConfirmDialog` - Dialogues de confirmation
  - `LoadingSkeleton` - Squelettes de chargement
  - `Pagination` - Navigation par pages
  - `ThemeToggle` - Basculement de thème
  - `ExportButton` - Export Excel/CSV

### ✅ 2. CI/CD avec GitHub Actions
- **Pipeline principal** (`ci.yml`) pour tests, build et déploiement
- **Vérifications PR** (`pr-checks.yml`) pour validation automatique
- **Tests automatisés** avec Vitest
- **Analyse de sécurité** avec npm audit et Snyk
- **Déploiement automatique** sur Vercel

## 🚀 Démarrage rapide

### Lancer Storybook localement
```bash
# Installer les dépendances Storybook (si pas déjà fait)
npm install --save-dev @storybook/nextjs @storybook/react @storybook/addon-essentials @storybook/addon-interactions @storybook/test

# Lancer Storybook
npm run storybook
```

Storybook sera accessible sur `http://localhost:6006`

### Construire Storybook pour production
```bash
npm run build-storybook
```

## 📖 Utilisation de Storybook

### Navigation
- **Components/** - Tous vos composants documentés
- **Docs** - Documentation automatique générée
- **Controls** - Testez les props en temps réel
- **Actions** - Visualisez les événements

### Tester les composants
1. Sélectionnez un composant dans la sidebar
2. Utilisez les **Controls** pour modifier les props
3. Testez les différentes **variantes** (Default, Loading, Error, etc.)
4. Vérifiez le **responsive design** avec les outils de viewport

## 🔄 Workflow CI/CD

### Déclenchement automatique
- **Push sur `main`** → Pipeline complet + déploiement
- **Push sur `develop`** → Tests et build uniquement
- **Pull Request** → Vérifications complètes

### Étapes du pipeline
1. **Tests** - Vitest, linting, TypeScript
2. **Build** - Vérification de construction
3. **Sécurité** - Audit npm et Snyk
4. **Storybook** - Build et déploiement sur GitHub Pages
5. **Déploiement** - Application sur Vercel (main uniquement)

### Vérifications PR
- ✅ Linting et formatage
- ✅ Tests unitaires
- ✅ Tests de composants Storybook
- ✅ Vérification du build
- ✅ Analyse de la taille du bundle
- ✅ Tests d'accessibilité

## 📝 Ajouter de nouveaux composants

### 1. Créer le composant
```typescript
// src/components/MonComposant.tsx
'use client';

interface MonComposantProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export default function MonComposant({ title, variant = 'primary' }: MonComposantProps) {
  return (
    <div className={`p-4 rounded-lg ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}`}>
      <h2 className="text-white">{title}</h2>
    </div>
  );
}
```

### 2. Créer la story
```typescript
// src/components/MonComposant.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import MonComposant from './MonComposant';

const meta = {
  title: 'Components/MonComposant',
  component: MonComposant,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Description de votre composant...',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof MonComposant>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Mon titre',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Titre secondaire',
    variant: 'secondary',
  },
};
```

### 3. Ajouter des tests
```typescript
// src/components/MonComposant.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MonComposant from './MonComposant';

describe('MonComposant', () => {
  it('affiche le titre correctement', () => {
    render(<MonComposant title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applique la variante primary par défaut', () => {
    render(<MonComposant title="Test" />);
    const element = screen.getByText('Test').parentElement;
    expect(element).toHaveClass('bg-blue-500');
  });
});
```

## 🔧 Configuration avancée

### Variables d'environnement pour CI/CD
Ajoutez ces secrets dans votre repository GitHub :

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_url

# Snyk (optionnel)
SNYK_TOKEN=your_snyk_token
```

### Personnaliser Storybook
Modifiez `.storybook/main.ts` pour :
- Ajouter des addons
- Configurer les chemins de stories
- Personnaliser la configuration

### Personnaliser les workflows
Modifiez `.github/workflows/` pour :
- Ajouter des étapes de test
- Configurer des notifications
- Personnaliser les déclencheurs

## 📊 Monitoring et métriques

### Storybook
- **Couverture des composants** - Vérifiez que tous les composants ont des stories
- **Documentation** - Assurez-vous que les descriptions sont complètes
- **Tests visuels** - Utilisez les stories pour les tests de régression

### CI/CD
- **Temps de build** - Surveillez les performances du pipeline
- **Taux de succès** - Suivez les échecs de tests
- **Couverture de code** - Maintenez un bon niveau de couverture

## 🎯 Prochaines étapes recommandées

### 1. Compléter la documentation
- [ ] Créer des stories pour tous les composants restants
- [ ] Ajouter des tests d'interaction avec `@storybook/test`
- [ ] Documenter les patterns de design

### 2. Améliorer les tests
- [ ] Augmenter la couverture de tests
- [ ] Ajouter des tests e2e avec Playwright
- [ ] Implémenter des tests de régression visuelle

### 3. Optimiser le workflow
- [ ] Configurer des notifications Slack/Discord
- [ ] Ajouter des métriques de performance
- [ ] Implémenter le déploiement par environnement

## 🆘 Dépannage

### Storybook ne démarre pas
```bash
# Nettoyer le cache
rm -rf node_modules/.cache
npm run storybook
```

### Erreurs de build CI/CD
1. Vérifiez les logs dans l'onglet Actions de GitHub
2. Assurez-vous que toutes les variables d'environnement sont configurées
3. Testez localement avec `npm run build`

### Tests qui échouent
```bash
# Lancer les tests en mode watch
npm run test

# Lancer les tests avec couverture
npm run test:coverage
```

## 📞 Support

Pour toute question :
1. Consultez la documentation Storybook : https://storybook.js.org/
2. Vérifiez les workflows GitHub Actions
3. Consultez les logs de build pour diagnostiquer les problèmes

---

🎉 **Félicitations !** Votre application dispose maintenant d'une infrastructure moderne de documentation et d'intégration continue.