'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

export interface FieldValidation {
  value: string;
  error?: string;
  isValid: boolean;
  isTouched: boolean;
  isValidating: boolean;
}

export interface FormValidationState {
  [fieldName: string]: FieldValidation;
}

export interface ValidationSchema {
  [fieldName: string]: z.ZodType<any> | ((value: string) => Promise<string | null> | string | null);
}

export interface UseInstantValidationOptions {
  schema: ValidationSchema;
  debounceMs?: number;
  validateOnMount?: boolean;
  onFieldChange?: (fieldName: string, value: string, isValid: boolean) => void;
  onFormValidChange?: (isValid: boolean, errors: Record<string, string>) => void;
}

export interface UseInstantValidationReturn {
  fields: FormValidationState;
  isFormValid: boolean;
  isFormValidating: boolean;
  hasFormErrors: boolean;
  formErrors: Record<string, string>;
  
  // Field methods
  updateField: (fieldName: string, value: string) => void;
  touchField: (fieldName: string) => void;
  validateField: (fieldName: string) => Promise<void>;
  clearFieldError: (fieldName: string) => void;
  setFieldError: (fieldName: string, error: string) => void;
  
  // Form methods
  validateForm: () => Promise<boolean>;
  resetForm: (initialValues?: Record<string, string>) => void;
  getFormData: () => Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  
  // Utility methods
  getFieldProps: (fieldName: string) => {
    value: string;
    error?: string;
    isValid: boolean;
    isTouched: boolean;
    isValidating: boolean;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
}

export const useInstantValidation = ({
  schema,
  debounceMs = 300,
  validateOnMount = false,
  onFieldChange,
  onFormValidChange,
}: UseInstantValidationOptions): UseInstantValidationReturn => {
  const [fields, setFields] = useState<FormValidationState>({});
  const debounceRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const validationRefs = useRef<Record<string, AbortController>>({});

  // Initialize fields from schema
  useEffect(() => {
    const initialFields: FormValidationState = {};
    Object.keys(schema).forEach(fieldName => {
      initialFields[fieldName] = {
        value: '',
        isValid: true,
        isTouched: false,
        isValidating: false,
      };
    });
    setFields(initialFields);
  }, [schema]);

  // Validate a single field
  const validateFieldValue = useCallback(async (fieldName: string, value: string): Promise<{ isValid: boolean; error?: string }> => {
    const validator = schema[fieldName];
    if (!validator) return { isValid: true };

    // Cancel previous validation
    if (validationRefs.current[fieldName]) {
      validationRefs.current[fieldName].abort();
    }
    
    validationRefs.current[fieldName] = new AbortController();

    try {
      if (validator instanceof z.ZodType) {
        // Zod validation
        try {
          validator.parse(value);
          return { isValid: true };
        } catch (err) {
          if (err instanceof z.ZodError) {
            return { isValid: false, error: err.issues[0]?.message || 'Valeur invalide' };
          }
        }
      } else if (typeof validator === 'function') {
        // Custom validation function
        const result = await validator(value);
        return { isValid: !result, error: result || undefined };
      }

      return { isValid: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      return { isValid: false, error: 'Erreur de validation' };
    }
  }, [schema]);

  // Update field value
  const updateField = useCallback((fieldName: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: undefined,
      }
    }));

    // Trigger validation if field is touched
    if (fields[fieldName]?.isTouched || validateOnMount) {
      // Clear existing debounce
      if (debounceRefs.current[fieldName]) {
        clearTimeout(debounceRefs.current[fieldName]);
      }

      // Set validating state
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValidating: true,
        }
      }));

      // Debounced validation
      debounceRefs.current[fieldName] = setTimeout(async () => {
        try {
          const result = await validateFieldValue(fieldName, value);
          
          setFields(prev => ({
            ...prev,
            [fieldName]: {
              ...prev[fieldName],
              isValid: result.isValid,
              error: result.error,
              isValidating: false,
            }
          }));

          onFieldChange?.(fieldName, value, result.isValid);
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            setFields(prev => ({
              ...prev,
              [fieldName]: {
                ...prev[fieldName],
                isValid: false,
                error: 'Erreur de validation',
                isValidating: false,
              }
            }));
          }
        }
      }, debounceMs);
    }

    onFieldChange?.(fieldName, value, fields[fieldName]?.isValid ?? true);
  }, [fields, validateOnMount, debounceMs, validateFieldValue, onFieldChange]);

  // Touch field (mark as interacted)
  const touchField = useCallback((fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isTouched: true,
      }
    }));

    // Trigger validation if not already validating
    if (!fields[fieldName]?.isValidating) {
      validateField(fieldName);
    }
  }, [fields]);

  // Validate field immediately
  const validateField = useCallback(async (fieldName: string) => {
    const field = fields[fieldName];
    if (!field) return;

    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValidating: true,
      }
    }));

    try {
      const result = await validateFieldValue(fieldName, field.value);
      
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValid: result.isValid,
          error: result.error,
          isValidating: false,
        }
      }));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setFields(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            isValid: false,
            error: 'Erreur de validation',
            isValidating: false,
          }
        }));
      }
    }
  }, [fields, validateFieldValue]);

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: undefined,
        isValid: true,
      }
    }));
  }, []);

  // Set field error
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        isValid: false,
      }
    }));
  }, []);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(schema).map(async (fieldName) => {
      const field = fields[fieldName];
      if (!field) return { fieldName, isValid: true };

      const result = await validateFieldValue(fieldName, field.value);
      return { fieldName, ...result };
    });

    const results = await Promise.all(validationPromises);
    
    const newFields = { ...fields };
    let isFormValid = true;

    results.forEach(({ fieldName, isValid, error }) => {
      newFields[fieldName] = {
        ...newFields[fieldName],
        isValid,
        error,
        isTouched: true,
        isValidating: false,
      };
      
      if (!isValid) {
        isFormValid = false;
      }
    });

    setFields(newFields);
    return isFormValid;
  }, [fields, schema, validateFieldValue]);

  // Reset form
  const resetForm = useCallback((initialValues?: Record<string, string>) => {
    const newFields: FormValidationState = {};
    
    Object.keys(schema).forEach(fieldName => {
      newFields[fieldName] = {
        value: initialValues?.[fieldName] || '',
        isValid: true,
        isTouched: false,
        isValidating: false,
      };
    });

    setFields(newFields);

    // Clear all debounces and validations
    Object.values(debounceRefs.current).forEach(timeout => clearTimeout(timeout));
    Object.values(validationRefs.current).forEach(controller => controller.abort());
    debounceRefs.current = {};
    validationRefs.current = {};
  }, [schema]);

  // Get form data
  const getFormData = useCallback((): Record<string, string> => {
    const data: Record<string, string> = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
      data[fieldName] = field.value;
    });
    return data;
  }, [fields]);

  // Set form data
  const setFormData = useCallback((data: Record<string, string>) => {
    setFields(prev => {
      const newFields = { ...prev };
      Object.entries(data).forEach(([fieldName, value]) => {
        if (newFields[fieldName]) {
          newFields[fieldName] = {
            ...newFields[fieldName],
            value,
          };
        }
      });
      return newFields;
    });
  }, []);

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName: string) => {
    const field = fields[fieldName] || {
      value: '',
      isValid: true,
      isTouched: false,
      isValidating: false,
    };

    return {
      value: field.value,
      error: field.error,
      isValid: field.isValid,
      isTouched: field.isTouched,
      isValidating: field.isValidating,
      onChange: (value: string) => updateField(fieldName, value),
      onBlur: () => touchField(fieldName),
    };
  }, [fields, updateField, touchField]);

  // Computed values
  const isFormValid = Object.values(fields).every(field => field.isValid);
  const isFormValidating = Object.values(fields).some(field => field.isValidating);
  const hasFormErrors = Object.values(fields).some(field => field.error);
  const formErrors = Object.entries(fields).reduce((acc, [fieldName, field]) => {
    if (field.error) {
      acc[fieldName] = field.error;
    }
    return acc;
  }, {} as Record<string, string>);

  // Notify form validation changes
  useEffect(() => {
    onFormValidChange?.(isFormValid, formErrors);
  }, [isFormValid, formErrors, onFormValidChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach(timeout => clearTimeout(timeout));
      Object.values(validationRefs.current).forEach(controller => controller.abort());
    };
  }, []);

  return {
    fields,
    isFormValid,
    isFormValidating,
    hasFormErrors,
    formErrors,
    updateField,
    touchField,
    validateField,
    clearFieldError,
    setFieldError,
    validateForm,
    resetForm,
    getFormData,
    setFormData,
    getFieldProps,
  };
};
