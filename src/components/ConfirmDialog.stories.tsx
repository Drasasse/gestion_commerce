import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ConfirmDialog from './ConfirmDialog';

const meta = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Un composant de dialogue de confirmation réutilisable avec différents types (danger, warning, info) et états de chargement.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['danger', 'warning', 'info'],
      description: 'Le type de dialogue qui détermine la couleur et l\'icône',
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement du dialogue',
    },
    isOpen: {
      control: 'boolean',
      description: 'Contrôle la visibilité du dialogue',
    },
  },
  args: {
    onClose: fn(),
    onConfirm: fn(),
    isOpen: true,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Danger: Story = {
  args: {
    title: 'Supprimer l\'élément',
    message: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
    type: 'danger',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
  },
};

export const Warning: Story = {
  args: {
    title: 'Attention',
    message: 'Cette action peut avoir des conséquences importantes. Voulez-vous continuer ?',
    type: 'warning',
    confirmText: 'Continuer',
    cancelText: 'Annuler',
  },
};

export const Info: Story = {
  args: {
    title: 'Information',
    message: 'Voulez-vous sauvegarder les modifications avant de quitter ?',
    type: 'info',
    confirmText: 'Sauvegarder',
    cancelText: 'Ignorer',
  },
};

export const Loading: Story = {
  args: {
    title: 'Suppression en cours',
    message: 'Veuillez patienter pendant la suppression de l\'élément...',
    type: 'danger',
    loading: true,
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
  },
};

export const CustomText: Story = {
  args: {
    title: 'Confirmer l\'action',
    message: 'Voulez-vous vraiment effectuer cette action personnalisée ?',
    type: 'info',
    confirmText: 'Oui, je confirme',
    cancelText: 'Non, annuler',
  },
};