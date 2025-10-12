'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Boutique } from '@/types';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { BoutiqueCard } from '@/components/ui/BoutiqueCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

interface BoutiqueWithStats extends Boutique {
  stats?: {
    totalVentes: number;
    totalImpayes: number;
    nombreUsers: number;
    nombreProduits: number;
    nombreVentes: number;
    nombreClients: number;
  };
}

interface FormData {
  nom: string;
  adresse: string;
  telephone: string;
  description: string;
  capitalInitial: string;
}

export default function BoutiquesPage() {
  const { data: session, status } = useSession();
  const [boutiques, setBoutiques] = useState<BoutiqueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState<BoutiqueWithStats | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    adresse: '',
    telephone: '',
    description: '',
    capitalInitial: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBoutiques();
  }, []);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  const loadBoutiques = async () => {
    try {
      const response = await fetch('/api/boutiques?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setBoutiques(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des boutiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.nom.trim()) {
      setErrors({ nom: 'Le nom est requis' });
      return;
    }

    try {
      const url = editingBoutique ? `/api/boutiques/${editingBoutique.id}` : '/api/boutiques';
      const method = editingBoutique ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        capitalInitial: parseFloat(formData.capitalInitial) || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadBoutiques();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error('Erreur:', errorData);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (boutique: Boutique) => {
    setEditingBoutique(boutique);
    setFormData({
      nom: boutique.nom,
      adresse: boutique.adresse || '',
      telephone: boutique.telephone || '',
      description: boutique.description || '',
      capitalInitial: boutique.capitalInitial?.toString() || '0',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) return;

    try {
      const response = await fetch(`/api/boutiques/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadBoutiques();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', adresse: '', telephone: '', description: '', capitalInitial: '0' });
    setEditingBoutique(null);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Gestion des Boutiques"
        description="Gérez vos boutiques et consultez leurs performances"
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Ajouter une boutique
          </Button>
        }
      />

      {/* Liste des boutiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boutiques.map((boutique) => (
          <BoutiqueCard
            key={boutique.id}
            boutique={boutique}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {boutiques.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune boutique. Cliquez sur &quot;Ajouter une boutique&quot; pour commencer.
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBoutique ? 'Modifier la boutique' : 'Ajouter une boutique'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="boutique-form"
            >
              {editingBoutique ? 'Modifier' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <form id="boutique-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              error={errors.nom}
              className={errors.nom ? 'border-red-500' : ''}
            />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <Input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <Input
              type="text"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capital Initial (FCFA)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.capitalInitial}
              onChange={(e) => setFormData({ ...formData, capitalInitial: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
