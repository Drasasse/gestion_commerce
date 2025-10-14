'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { exportClientsToExcel, exportClientsToCSV } from '@/lib/export';
import AccessibleTable from '@/components/AccessibleTable';
import { PageLoading, ButtonLoading, ModalLoading } from '@/components/GlobalLoading';
import { useLoadingState, useCrudLoadingState } from '@/hooks/useLoadingState';
import { useRealtimeValidation, ValidationSchema } from '@/hooks/useFormValidation';
import FormField from '@/components/FormField';

interface Client {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  createdAt: string;
  _count: {
    ventes: number;
  };
}

interface ClientFormData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  email: string;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
  });

  // États de chargement standardisés
  const { isLoading: pageLoading, setLoading: setPageLoading } = useLoadingState({ isLoading: true });
  const { creating, updating, deleting, setCreating, setUpdating, setDeleting, error: crudError, setError: setCrudError } = useCrudLoadingState();

  // Schéma de validation
  const validationSchema: ValidationSchema = {
    nom: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    prenom: {
      maxLength: 50,
    },
    telephone: {
      phone: true,
    },
    email: {
      email: true,
    },
    adresse: {
      maxLength: 200,
    },
  };

  // Validation en temps réel
  const {
    errors,
    validateFieldRealtime,
    markFieldAsTouched,
    getFieldError,
    validateForm,
    clearErrors,
  } = useRealtimeValidation(validationSchema);



  const loadClients = useCallback(async () => {
    try {
      setPageLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setCrudError('Erreur lors du chargement des clients');
    } finally {
      setPageLoading(false);
    }
  }, [searchTerm, setPageLoading, setCrudError]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    loadClients();
  }, [session, status, router, searchTerm, loadClients]);

  if (status === 'loading') {
    return <PageLoading text="Vérification de l'authentification..." />;
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du formulaire
    if (!validateForm(formData)) {
      return;
    }
    
    try {
      const isEditing = !!editingClient;
      if (isEditing) {
        setUpdating(true);
      } else {
        setCreating(true);
      }

      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadClients();
        resetForm();
        setShowModal(false);
        clearErrors();
      } else {
        const errorData = await response.json();
        setCrudError(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setCrudError('Erreur de connexion');
    } finally {
      setCreating(false);
      setUpdating(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ${client.prenom || ''} ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadClients();
      } else {
        const error = await response.json();
        alert(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      email: '',
    });
    setEditingClient(null);
  };

  const openEditModal = (client: Client) => {
    setFormData({
      nom: client.nom,
      prenom: client.prenom ?? '',
      telephone: client.telephone ?? '',
      adresse: client.adresse ?? '',
      email: client.email ?? '',
    });
    setEditingClient(client);
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-2">Gérez votre base de données clients</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            onExportExcel={() => exportClientsToExcel(clients as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            onExportCSV={() => exportClientsToCSV(clients as unknown as Record<string, unknown>[], session?.user?.boutique?.nom)}
            disabled={clients.length === 0}
          />
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouveau Client
          </button>
        </div>
      </div>



      {/* Liste des clients */}
      <AccessibleTable
        data={clients}
        columns={[
          {
            key: 'client',
            header: 'Client',
            sortable: true,
            render: (client: Client) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {client.nom} {client.prenom}
                  </div>
                  {client.adresse && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {client.adresse}
                    </div>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (client: Client) => (
              <div className="space-y-1">
                {client.telephone && (
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {client.telephone}
                  </div>
                )}
                {client.email && (
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'ventes',
            header: 'Ventes',
            sortable: true,
            render: (client: Client) => (
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {client._count.ventes}
                </span>
              </div>
            )
          },
          {
            key: 'createdAt',
            header: 'Date d\'ajout',
            sortable: true,
            render: (client: Client) => (
              <span className="text-sm text-gray-500">
                {new Date(client.createdAt).toLocaleDateString('fr-FR')}
              </span>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (client: Client) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(client)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="text-red-600 hover:text-red-900 p-1 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          }
        ]}
        loading={pageLoading}
        searchable={true}
        onSearch={setSearchTerm}
        emptyMessage="Aucun client trouvé"
        ariaLabel="Liste des clients"
        caption="Tableau des clients avec leurs informations de contact et historique des ventes"
      />

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  id="nom"
                  label="Nom"
                  type="text"
                  required
                  value={formData.nom}
                  error={getFieldError('nom')}
                  leftIcon={<User size={20} />}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, nom: value });
                    validateFieldRealtime('nom', value);
                  }}
                  onBlur={() => markFieldAsTouched('nom')}
                  placeholder="Entrez le nom du client"
                />

                <FormField
                  id="prenom"
                  label="Prénom"
                  type="text"
                  value={formData.prenom}
                  error={getFieldError('prenom')}
                  leftIcon={<User size={20} />}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, prenom: value });
                    validateFieldRealtime('prenom', value);
                  }}
                  onBlur={() => markFieldAsTouched('prenom')}
                  placeholder="Entrez le prénom du client"
                />

                <FormField
                  id="telephone"
                  label="Téléphone"
                  type="tel"
                  value={formData.telephone}
                  error={getFieldError('telephone')}
                  leftIcon={<Phone size={20} />}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, telephone: value });
                    validateFieldRealtime('telephone', value);
                  }}
                  onBlur={() => markFieldAsTouched('telephone')}
                  placeholder="Ex: +33 1 23 45 67 89"
                  hint="Format: +33 ou 0 suivi de 9 chiffres"
                />

                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  error={getFieldError('email')}
                  leftIcon={<Mail size={20} />}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, email: value });
                    validateFieldRealtime('email', value);
                  }}
                  onBlur={() => markFieldAsTouched('email')}
                  placeholder="client@exemple.com"
                />

                <FormField
                  id="adresse"
                  label="Adresse"
                  type="textarea"
                  rows={3}
                  value={formData.adresse}
                  error={getFieldError('adresse')}
                  leftIcon={<MapPin size={20} />}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, adresse: value });
                    validateFieldRealtime('adresse', value);
                  }}
                  onBlur={() => markFieldAsTouched('adresse')}
                  placeholder="Adresse complète du client"
                />
                {/* Affichage des erreurs CRUD */}
                {crudError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{crudError}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      clearErrors();
                      setCrudError(null);
                    }}
                    disabled={creating || updating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating || updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {(creating || updating) && <ButtonLoading size="sm">Chargement...</ButtonLoading>}
                    <span>{editingClient ? 'Modifier' : 'Créer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}