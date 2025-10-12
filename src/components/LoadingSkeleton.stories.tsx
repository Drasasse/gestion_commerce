import type { Meta, StoryObj } from '@storybook/react';
import LoadingSkeleton, { PageLoadingSkeleton } from './LoadingSkeleton';

const meta = {
  title: 'Components/LoadingSkeleton',
  component: LoadingSkeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Composants de squelettes de chargement pour différents types de contenu (cartes, tableaux, statistiques, listes, formulaires).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['card', 'table', 'stat', 'list', 'form'],
      description: 'Le type de squelette à afficher',
    },
    count: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Nombre d\'éléments de squelette à afficher',
    },
  },
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: {
    type: 'card',
    count: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Squelettes pour des cartes de contenu avec titre, icône et description.',
      },
    },
  },
};

export const Table: Story = {
  args: {
    type: 'table',
    count: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Squelette pour un tableau avec en-têtes et lignes de données.',
      },
    },
  },
};

export const Stat: Story = {
  args: {
    type: 'stat',
    count: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Squelettes pour des cartes de statistiques avec valeur et icône.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Story />
      </div>
    ),
  ],
};

export const List: Story = {
  args: {
    type: 'list',
    count: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Squelettes pour des listes d\'éléments avec avatar et texte.',
      },
    },
  },
};

export const Form: Story = {
  args: {
    type: 'form',
    count: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Squelettes pour des champs de formulaire avec labels.',
      },
    },
  },
};

export const SingleCard: Story = {
  args: {
    type: 'card',
    count: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Un seul squelette de carte.',
      },
    },
  },
};

// Story pour le composant PageLoadingSkeleton
export const FullPage: StoryObj<typeof PageLoadingSkeleton> = {
  render: () => <PageLoadingSkeleton />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Squelette complet pour une page avec en-tête, statistiques et tableau.',
      },
    },
  },
};