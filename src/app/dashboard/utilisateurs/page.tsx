'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import toast from 'react-hot-toast';

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ajouter un utilisateur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.boutique?.nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 mr-3">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? 'Modifier' : 'Ajouter'} un utilisateur
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                </label>
                <input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                <select value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'GESTIONNAIRE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="GESTIONNAIRE">Gestionnaire</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              {formData.role === 'GESTIONNAIRE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boutique *</label>
                  <select value={formData.boutiqueId}
                    onChange={(e) => setFormData({ ...formData, boutiqueId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${errors.boutiqueId ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Sélectionner une boutique</option>
                    {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                  </select>
                  {errors.boutiqueId && <p className="text-red-500 text-xs mt-1">{errors.boutiqueId}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
