'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { InstantValidationField } from './InstantValidationField';
import { useInstantValidation } from '@/hooks/useInstantValidation';
import { User, Mail, Phone, Lock, Building, MapPin, Save, Loader2 } from 'lucide-react';

// Schéma de validation Zod
const userSchema = {
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  
  lastName: z.string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  
  phone: z.string()
    .min(1, 'Le téléphone est requis')
    .regex(/^(\+33|0)[1-9](\d{8})$/, 'Format de téléphone invalide (ex: 0123456789)'),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  confirmPassword: z.string()
    .min(1, 'La confirmation du mot de passe est requise'),
  
  company: z.string()
    .min(1, 'Le nom de l\'entreprise est requis')
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
  
  address: z.string()
    .min(1, 'L\'adresse est requise')
    .min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  
  role: z.string()
    .min(1, 'Le rôle est requis'),
};

// Validation personnalisée pour la confirmation du mot de passe supprimée car non utilisée

// Validation asynchrone pour l'email (simulation d'une vérification côté serveur)
const emailAsyncValidator = async (email: string): Promise<string | null> => {
  if (!email) return null;
  
  // Simulation d'une requête API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulation de vérification d'unicité
  const existingEmails = ['admin@example.com', 'user@test.com', 'demo@demo.com'];
  if (existingEmails.includes(email.toLowerCase())) {
    return 'Cet email est déjà utilisé';
  }
  
  return null;
};

interface InstantValidationFormProps {
  onSubmit?: (data: Record<string, string>) => Promise<void>;
  initialData?: Record<string, string>;
  className?: string;
}

export const InstantValidationForm: React.FC<InstantValidationFormProps> = ({
  onSubmit,
  initialData,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Configuration du hook de validation
  const validation = useInstantValidation({
    schema: {
      ...userSchema,
      email: emailAsyncValidator, // Validation asynchrone pour l'email
    },
    debounceMs: 500,
    validateOnMount: false,
    onFieldChange: (fieldName, value, isValid) => {
      console.log(`Field ${fieldName} changed:`, { value, isValid });
    },
    onFormValidChange: (isValid, errors) => {
      console.log('Form validation changed:', { isValid, errors });
    },
  });

  // Initialiser les données si fournies
  React.useEffect(() => {
    if (initialData) {
      validation.setFormData(initialData);
    }
  }, [initialData, validation]);

  // Validation personnalisée pour la confirmation du mot de passe
  const confirmPasswordProps = validation.getFieldProps('confirmPassword');
  const passwordValue = validation.getFieldProps('password').value;

  React.useEffect(() => {
    if (confirmPasswordProps.value && passwordValue) {
      if (confirmPasswordProps.value !== passwordValue) {
        validation.setFieldError('confirmPassword', 'Les mots de passe ne correspondent pas');
      } else {
        validation.clearFieldError('confirmPassword');
      }
    }
  }, [confirmPasswordProps.value, passwordValue, validation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    // Valider tout le formulaire
    const isValid = await validation.validateForm();
    
    if (!isValid) {
      setSubmitMessage({
        type: 'error',
        message: 'Veuillez corriger les erreurs dans le formulaire'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = validation.getFormData();
      await onSubmit?.(formData);
      
      setSubmitMessage({
        type: 'success',
        message: 'Formulaire soumis avec succès !'
      });
      
      // Réinitialiser le formulaire après succès
      validation.resetForm();
    } catch {
      setSubmitMessage({
        type: 'error',
        message: 'Erreur lors de la soumission du formulaire'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Gestionnaire' },
    { value: 'employee', label: 'Employé' },
    { value: 'client', label: 'Client' },
  ];

  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Formulaire avec Validation Instantanée
        </h2>
        <p className="text-gray-600">
          Tous les champs sont validés en temps réel avec feedback visuel
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Informations personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InstantValidationField
              label="Prénom"
              name="firstName"
              type="text"
              zodSchema={userSchema.firstName}
              leftIcon={<User size={20} />}
              hint="Votre prénom (2-50 caractères)"
              {...validation.getFieldProps('firstName')}
            />

            <InstantValidationField
              label="Nom"
              name="lastName"
              type="text"
              zodSchema={userSchema.lastName}
              leftIcon={<User size={20} />}
              hint="Votre nom de famille (2-50 caractères)"
              {...validation.getFieldProps('lastName')}
            />
          </div>

          <InstantValidationField
            label="Email"
            name="email"
            type="email"
            validation={{ custom: emailAsyncValidator }}
            leftIcon={<Mail size={20} />}
            hint="Votre adresse email (vérification d'unicité en cours...)"
            debounceMs={1000}
            {...validation.getFieldProps('email')}
          />

          <InstantValidationField
            label="Téléphone"
            name="phone"
            type="tel"
            zodSchema={userSchema.phone}
            leftIcon={<Phone size={20} />}
            hint="Format: 0123456789 ou +33123456789"
            {...validation.getFieldProps('phone')}
          />
        </div>

        {/* Sécurité */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Sécurité
          </h3>

          <InstantValidationField
            label="Mot de passe"
            name="password"
            type="password"
            zodSchema={userSchema.password}
            leftIcon={<Lock size={20} />}
            showPasswordToggle
            hint="8 caractères minimum avec majuscule, minuscule et chiffre"
            {...validation.getFieldProps('password')}
          />

          <InstantValidationField
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            leftIcon={<Lock size={20} />}
            showPasswordToggle
            hint="Doit correspondre au mot de passe ci-dessus"
            {...confirmPasswordProps}
          />
        </div>

        {/* Informations professionnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Informations professionnelles
          </h3>

          <InstantValidationField
            label="Entreprise"
            name="company"
            type="text"
            zodSchema={userSchema.company}
            leftIcon={<Building size={20} />}
            hint="Nom de votre entreprise"
            {...validation.getFieldProps('company')}
          />

          <InstantValidationField
            label="Adresse"
            name="address"
            type="textarea"
            zodSchema={userSchema.address}
            leftIcon={<MapPin size={20} />}
            hint="Adresse complète de l'entreprise"
            rows={3}
            {...validation.getFieldProps('address')}
          />

          <InstantValidationField
            label="Rôle"
            name="role"
            type="select"
            zodSchema={userSchema.role}
            options={roleOptions}
            hint="Sélectionnez votre rôle dans l'entreprise"
            {...validation.getFieldProps('role')}
          />
        </div>

        {/* Message de soumission */}
        {submitMessage && (
          <div className={`p-4 rounded-lg ${
            submitMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {submitMessage.message}
          </div>
        )}

        {/* État du formulaire */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className={`flex items-center space-x-1 ${
                validation.isFormValid ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  validation.isFormValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>
                  {validation.isFormValid ? 'Formulaire valide' : 'Formulaire invalide'}
                </span>
              </span>
              
              {validation.isFormValidating && (
                <span className="flex items-center space-x-1 text-blue-600">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Validation en cours...</span>
                </span>
              )}
            </div>
            
            <span className="text-gray-500">
              {Object.keys(validation.formErrors).length} erreur(s)
            </span>
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={!validation.isFormValid || validation.isFormValidating || isSubmitting}
          className={`
            w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${validation.isFormValid && !validation.isFormValidating && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Soumission en cours...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Soumettre le formulaire</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};