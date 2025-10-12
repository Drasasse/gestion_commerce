import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from 'next-themes';
import ThemeToggle from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bouton de basculement de thème qui permet de changer entre les modes clair, sombre et système.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Bouton de basculement de thème par défaut. Cliquez pour basculer entre les thèmes clair, sombre et système.',
      },
    },
  },
};

export const LightTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="p-4 bg-white rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Bouton de thème en mode clair.',
      },
    },
  },
};

export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="p-4 bg-gray-900 rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Bouton de thème en mode sombre.',
      },
    },
  },
};

export const SystemTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Bouton de thème en mode système (suit les préférences du système).',
      },
    },
  },
};