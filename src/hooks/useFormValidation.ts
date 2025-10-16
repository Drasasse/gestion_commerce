import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: unknown) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface FormValidationResult {
  errors: ValidationErrors;
  isValid: boolean;
  hasErrors: boolean;
  validateField: (field: string, value: unknown) => string | null;
  validateForm: (data: Record<string, unknown>) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  setFieldError: (field: string, error: string) => void;
}

const validateValue = (value: unknown, rules: ValidationRule): string | null => {
  // Vérification required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'Ce champ est requis';
  }

  // Si la valeur est vide et non requise, pas d'autres validations
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const stringValue = String(value);

  // Vérification longueur minimale
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Minimum ${rules.minLength} caractères requis`;
  }

  // Vérification longueur maximale
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Maximum ${rules.maxLength} caractères autorisés`;
  }

  // Vérification email
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return 'Format d\'email invalide';
    }
  }

  // Vérification téléphone
  if (rules.phone) {
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
    if (!phoneRegex.test(stringValue.replace(/\s/g, ''))) {
      return 'Format de téléphone invalide';
    }
  }

  // Vérification pattern
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Format invalide';
  }

  // Validation personnalisée
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const useFormValidation = (schema: ValidationSchema): FormValidationResult => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((field: string, value: unknown): string | null => {
    const rules = schema[field];
    if (!rules) return null;

    const error = validateValue(value, rules);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });

    return error;
  }, [schema]);

  const validateForm = useCallback((data: Record<string, unknown>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(schema).forEach(field => {
      const error = validateValue(data[field], schema[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const isValid = Object.keys(errors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    isValid,
    hasErrors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setFieldError
  };
};

// Hook spécialisé pour les formulaires avec validation en temps réel
export const useRealtimeValidation = (schema: ValidationSchema) => {
  const validation = useFormValidation(schema);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const markFieldAsTouched = useCallback((field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  }, []);

  const validateFieldRealtime = useCallback((field: string, value: unknown) => {
    // Valider seulement si le champ a été touché
    if (touchedFields.has(field)) {
      return validation.validateField(field, value);
    }
    return null;
  }, [validation, touchedFields]);

  const getFieldError = useCallback((field: string) => {
    return touchedFields.has(field) ? validation.errors[field] : undefined;
  }, [validation.errors, touchedFields]);

  return {
    ...validation,
    touchedFields,
    markFieldAsTouched,
    validateFieldRealtime,
    getFieldError
  };
};
