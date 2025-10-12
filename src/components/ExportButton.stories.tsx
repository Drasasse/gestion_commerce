import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ExportButton from './ExportButton';

const meta = {
  title: 'Components/ExportButton',
  component: ExportButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bouton d\'export avec menu déroulant pour exporter des données en format Excel ou CSV.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Désactive le bouton d\'export',
    },
    label: {
      control: 'text',
      description: 'Texte affiché sur le bouton',
    },
  },
  args: {
    onExportExcel: fn(),
    onExportCSV: fn(),
  },
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    disabled: false,
    label: 'Exporter',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bouton d\'export par défaut. Cliquez pour voir le menu déroulant avec les options Excel et CSV.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Exporter',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bouton d\'export désactivé.',
      },
    },
  },
};

export const CustomLabel: Story = {
  args: {
    disabled: false,
    label: 'Télécharger les données',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bouton d\'export avec un label personnalisé.',
      },
    },
  },
};

export const InToolbar: Story = {
  args: {
    disabled: false,
    label: 'Export',
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Ajouter
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg">
          Filtrer
        </button>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Bouton d\'export intégré dans une barre d\'outils.',
      },
    },
  },
};