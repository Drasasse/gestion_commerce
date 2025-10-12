import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Pagination from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Composant de pagination avec navigation par pages, sélection du nombre d\'éléments par page et informations sur les résultats.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1 },
      description: 'Page actuellement sélectionnée',
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Nombre total de pages',
    },
    totalItems: {
      control: { type: 'number', min: 0 },
      description: 'Nombre total d\'éléments',
    },
    itemsPerPage: {
      control: 'select',
      options: [5, 10, 25, 50, 100],
      description: 'Nombre d\'éléments par page',
    },
  },
  args: {
    onPageChange: fn(),
    onItemsPerPageChange: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination par défaut avec 10 pages et 100 éléments.',
      },
    },
  },
};

export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 20,
    totalItems: 500,
    itemsPerPage: 25,
  },
  parameters: {
    docs: {
      description: {
        story: 'Première page d\'une pagination avec beaucoup de pages.',
      },
    },
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 10,
    totalPages: 20,
    totalItems: 500,
    itemsPerPage: 25,
  },
  parameters: {
    docs: {
      description: {
        story: 'Page du milieu avec ellipsis avant et après.',
      },
    },
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 20,
    totalPages: 20,
    totalItems: 500,
    itemsPerPage: 25,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dernière page d\'une pagination.',
      },
    },
  },
};

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    totalItems: 30,
    itemsPerPage: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination avec peu de pages (pas d\'ellipsis).',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    currentPage: 50,
    totalPages: 100,
    totalItems: 10000,
    itemsPerPage: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination pour un grand jeu de données.',
      },
    },
  },
};

export const SmallItemsPerPage: Story = {
  args: {
    currentPage: 3,
    totalPages: 20,
    totalItems: 100,
    itemsPerPage: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination avec 5 éléments par page.',
      },
    },
  },
};