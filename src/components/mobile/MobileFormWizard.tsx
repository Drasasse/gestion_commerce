'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertCircle, X } from 'lucide-react';

export interface FormStep<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  component: React.ComponentType<StepComponentProps<T>>;
  validation?: (data: T) => Promise<ValidationResult> | ValidationResult;
  optional?: boolean;
}

export interface StepComponentProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T;
  updateData: (updates: Partial<T>) => void;
  errors: Record<string, string>;
  isValid: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface MobileFormWizardProps<T extends Record<string, unknown> = Record<string, unknown>> {
  steps: FormStep<T>[];
  initialData?: T;
  onComplete: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
  showProgress?: boolean;
  allowSkipOptional?: boolean;
  persistData?: boolean;
  storageKey?: string;
}

export function MobileFormWizard<T extends Record<string, unknown> = Record<string, unknown>>({
  steps,
  initialData,
  onComplete,
  onCancel,
  className = "",
  showProgress = true,
  allowSkipOptional = true,
  persistData = false,
  storageKey = "mobile-form-wizard"
}: MobileFormWizardProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<T>(initialData || {} as T);
  const [stepValidation, setStepValidation] = useState<Record<string, ValidationResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Persistance des données
  useEffect(() => {
    if (persistData && storageKey) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.warn('Erreur lors du chargement des données sauvegardées:', error);
        }
      }
    }
  }, [persistData, storageKey]);

  useEffect(() => {
    if (persistData && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, persistData, storageKey]);

  // Validation d'une étape
  const validateStep = useCallback(async (stepIndex: number, data: T): Promise<ValidationResult> => {
    const step = steps[stepIndex];
    if (!step.validation) {
      return { isValid: true, errors: {} };
    }

    try {
      const result = await step.validation(data);
      return result;
    } catch {
      return {
        isValid: false,
        errors: { general: 'Erreur de validation' }
      };
    }
  }, [steps]);

  // Mise à jour des données
  const updateData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Soumission finale
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      
      // Nettoyage des données persistées
      if (persistData && storageKey) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onComplete, persistData, storageKey]);

  // Navigation vers l'étape suivante
  const goToNext = useCallback(async () => {
    if (isLastStep) {
      await handleSubmit();
      return;
    }

    // Validation de l'étape actuelle
    const validation = await validateStep(currentStepIndex, formData);
    setStepValidation(prev => ({
      ...prev,
      [currentStep.id]: validation
    }));

    if (validation.isValid || (currentStep.optional && allowSkipOptional)) {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStepIndex, currentStep, formData, isLastStep, validateStep, allowSkipOptional, steps.length, handleSubmit]);

  // Navigation vers l'étape précédente
  const goToPrevious = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Navigation directe vers une étape
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps.length]);

  // Annulation
  const handleCancel = useCallback(() => {
    if (persistData && storageKey) {
      localStorage.removeItem(storageKey);
    }
    onCancel?.();
  }, [onCancel, persistData, storageKey]);

  const currentValidation = stepValidation[currentStep.id] || { isValid: true, errors: {} };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* En-tête avec progression */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentStep.title}
          </h2>
          {onCancel && (
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {currentStep.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {currentStep.description}
          </p>
        )}

        {/* Barre de progression */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Étape {currentStepIndex + 1} sur {steps.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Indicateurs d'étapes */}
        <div className="flex justify-center mt-4 space-x-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : completedSteps.has(index)
                  ? 'bg-green-600 text-white'
                  : index < currentStepIndex
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-500'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              disabled={index > currentStepIndex && !completedSteps.has(index)}
            >
              {completedSteps.has(index) ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="px-6 py-6">
        {/* Erreurs de validation */}
        {!currentValidation.isValid && Object.keys(currentValidation.errors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Veuillez corriger les erreurs suivantes :
                </h4>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                  {Object.entries(currentValidation.errors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Composant de l'étape */}
        <currentStep.component
          data={formData}
          updateData={updateData}
          errors={currentValidation.errors}
          isValid={currentValidation.isValid}
          onNext={goToNext}
          onPrevious={goToPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      </div>

      {/* Boutons de navigation */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
        <div className="flex justify-between">
          <button
            onClick={goToPrevious}
            disabled={isFirstStep}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isFirstStep
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Précédent</span>
          </button>

          <div className="flex space-x-3">
            {currentStep.optional && allowSkipOptional && !isLastStep && (
              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Ignorer
              </button>
            )}

            <button
              onClick={goToNext}
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}