'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableCell } from '@/components/ui/Table';
import { Edit, Trash2 } from 'lucide-react';

interface Boutique {
  id: string;
  nom: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTIONNAIRE';
  boutiqueId: string | null;
  boutique?: Boutique | null;
  createdAt: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'GESTIONNAIRE';
  boutiqueId: string;
}

export default function UtilisateursPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'GESTIONNAIRE',
    boutiqueId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  if (status === 'loading') return <div>Chargement...</div>;
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  const loadData = async () => {
    try {
      const [usersRes, boutiquesRes] = await Promise.all([
        fetch('/api/utilisateurs'),
        fetch('/api/boutiques'),
      ]);

      if (usersRes.ok && boutiquesRes.ok) {
        setUsers(await usersRes.json());
        setBoutiques(await boutiquesRes.json());
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    if (!editingUser && !formData.password) newErrors.password = 'Le mot de passe est requis';
    if (formData.role === 'GESTIONNAIRE' && !formData.boutiqueId) {
      newErrors.boutiqueId = 'La boutique est requise pour un gestionnaire';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload: {
        name: string;
        email: string;
        role: string;
        boutiqueId: string | null;
        password?: string;
      } = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        boutiqueId: formData.role === 'GESTIONNAIRE' ? formData.boutiqueId : null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const url = editingUser ? `/api/utilisateurs/${editingUser.id}` : '/api/utilisateurs';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingUser ? 'Utilisateur modifié' : 'Utilisateur créé');
        await loadData();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      boutiqueId: user.boutiqueId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`/api/utilisateurs/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Utilisateur supprimé');
        await loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'GESTIONNAIRE', boutiqueId: '' });
    setEditingUser(null);
    setErrors({});
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Gérez les utilisateurs et leurs accès aux boutiques"
        actions={
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            Ajouter un utilisateur
          </Button>
        }
      />

      <Table
        columns={[
          { key: 'name', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Rôle' },
          { key: 'boutique', label: 'Boutique' },
          { key: 'actions', label: 'Actions' },
        ]}
        data={users}
        renderRow={(user) => (
          <>
            <TableCell>
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-900">{user.email}</div>
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role}
              </span>
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-900">{user.boutique?.nom || '-'}</div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  className="p-2"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </TableCell>
          </>
        )}
        emptyMessage="Aucun utilisateur trouvé"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingUser ? 'Modifier' : 'Ajouter'} un utilisateur`}
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
              form="user-form"
            >
              {editingUser ? 'Modifier' : 'Créer'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
            <Select
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as 'ADMIN' | 'GESTIONNAIRE' })}
              options={[
                { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
                { value: 'ADMIN', label: 'Administrateur' },
              ]}
              placeholder="Sélectionner un rôle"
            />
          </div>

          {formData.role === 'GESTIONNAIRE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Boutique *</label>
              <Select
                value={formData.boutiqueId}
                onChange={(value) => setFormData({ ...formData, boutiqueId: value })}
                options={boutiques.map(b => ({ value: b.id, label: b.nom }))}
                placeholder="Sélectionner une boutique"
                error={errors.boutiqueId}
              />
              {errors.boutiqueId && <p className="text-red-500 text-xs mt-1">{errors.boutiqueId}</p>}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
