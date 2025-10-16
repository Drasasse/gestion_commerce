'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { z } from 'zod';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
  custom?: (value: string) => Promise<string | null> | string | null;
}

export interface InstantValidationFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 'onChange' | 'size'> {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' | 'textarea' | 'select';
  validation?: ValidationRule;
  zodSchema?: z.ZodType<unknown>;
  options?: { value: string; label: string }[];
  rows?: number;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
  debounceMs?: number;
  validateOnMount?: boolean;
  showValidationProgress?: boolean;
  onChange?: (value: string, isValid: boolean, error?: string) => void;
  onValidationComplete?: (isValid: boolean, error?: string) => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

export const InstantValidationField: React.FC<InstantValidationFieldProps> = ({
  label,
  name,
  type = 'text',
  validation,
  zodSchema,
  options = [],
  rows = 3,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  hint,
  debounceMs = 300,
  validateOnMount = false,
  showValidationProgress = true,
  onChange,
  onValidationComplete,
  variant = 'default',
  size = 'md',
  className = '',
  required,
  value: controlledValue,
  ...props
}) => {
  const [value, setValue] = useState(controlledValue || '');
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationRef = useRef<AbortController | null>(null);

  // Fonction de validation
  const validateValue = useCallback(async (val: string): Promise<{ isValid: boolean; error?: string }> => {
    // Annuler la validation précédente
    if (validationRef.current) {
      validationRef.current.abort();
    }
    
    validationRef.current = new AbortController();
    
    try {
      // Validation avec Zod si fourni
      if (zodSchema) {
        try {
          zodSchema.parse(val);
          return { isValid: true };
        } catch (err) {
          if (err instanceof z.ZodError) {
            return { isValid: false, error: err.issues[0]?.message || 'Valeur invalide' };
          }
        }
      }

      // Validation avec les règles personnalisées
      if (validation) {
        // Required
        if (validation.required && (!val || val.trim() === '')) {
          return { isValid: false, error: 'Ce champ est requis' };
        }

        // Si vide et non requis, c'est valide
        if (!val || val.trim() === '') {
          return { isValid: true };
        }

        // MinLength
        if (validation.minLength && val.length < validation.minLength) {
          return { isValid: false, error: `Minimum ${validation.minLength} caractères requis` };
        }

        // MaxLength
        if (validation.maxLength && val.length > validation.maxLength) {
          return { isValid: false, error: `Maximum ${validation.maxLength} caractères autorisés` };
        }

        // Email
        if (validation.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            return { isValid: false, error: 'Format d\'email invalide' };
          }
        }

        // Phone
        if (validation.phone) {
          const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
          if (!phoneRegex.test(val.replace(/\s/g, ''))) {
            return { isValid: false, error: 'Format de téléphone invalide' };
          }
        }

        // URL
        if (validation.url) {
          try {
            new URL(val);
          } catch {
            return { isValid: false, error: 'URL invalide' };
          }
        }

        // Number
        if (validation.number) {
          const num = parseFloat(val);
          if (isNaN(num)) {
            return { isValid: false, error: 'Doit être un nombre' };
          }
          
          if (validation.min !== undefined && num < validation.min) {
            return { isValid: false, error: `Minimum: ${validation.min}` };
          }
          
          if (validation.max !== undefined && num > validation.max) {
            return { isValid: false, error: `Maximum: ${validation.max}` };
          }
        }

        // Pattern
        if (validation.pattern && !validation.pattern.test(val)) {
          return { isValid: false, error: 'Format invalide' };
        }

        // Custom validation
        if (validation.custom) {
          const customResult = await validation.custom(val);
          if (customResult) {
            return { isValid: false, error: customResult };
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      return { isValid: false, error: 'Erreur de validation' };
    }
  }, [validation, zodSchema]);

  // Fonction de validation avec debounce
  const debouncedValidate = useCallback((val: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setValidationState('validating');

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await validateValue(val);
        setValidationState(result.isValid ? 'valid' : 'invalid');
        setError(result.error || '');
        
        onValidationComplete?.(result.isValid, result.error);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setValidationState('invalid');
          setError('Erreur de validation');
        }
      }
    }, debounceMs);
  }, [validateValue, debounceMs, onValidationComplete]);

  // Gérer les changements de valeur
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    
    if (isTouched || validateOnMount) {
      debouncedValidate(newValue);
    }

    const isValid = validationState === 'valid' && !error;
    onChange?.(newValue, isValid, error);
  }, [isTouched, validateOnMount, debouncedValidate, onChange, validationState, error]);

  // Gérer le blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsTouched(true);
    
    if (!isTouched) {
      debouncedValidate(String(value || ''));
    }
  }, [isTouched, debouncedValidate, value]);

  // Validation au montage si demandée
  useEffect(() => {
    if (validateOnMount && value) {
      debouncedValidate(String(value || ''));
    }
  }, [validateOnMount, debouncedValidate, value]);

  // Synchroniser avec la valeur contrôlée
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue);
    }
  }, [controlledValue, value]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (validationRef.current) {
        validationRef.current.abort();
      }
    };
  }, []);

  // Classes CSS
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100',
    outlined: 'border-2 border-gray-300 bg-transparent'
  };

  const getStateClasses = () => {
    if (validationState === 'invalid' && isTouched) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    if (validationState === 'valid' && isTouched) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    if (isFocused) {
      return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500';
    }
    return 'focus:border-blue-500 focus:ring-blue-500';
  };

  const inputClasses = `
    w-full rounded-lg transition-all duration-200 ease-in-out
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${getStateClasses()}
    ${leftIcon ? 'pl-10' : ''}
    ${(rightIcon || showPasswordToggle || showValidationProgress) ? 'pr-10' : ''}
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${className}
  `;

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const renderInput = () => {
    const commonProps = {
      ...props,
      className: inputClasses,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(e.target.value),
      onBlur: handleBlur,
      onFocus: () => setIsFocused(true),
      'aria-invalid': validationState === 'invalid' && isTouched,
      'aria-describedby': `${name}-hint ${name}-error`,
      required: required || validation?.required,
    };

    if (type === 'textarea') {
      return <textarea {...commonProps} rows={rows} />;
    }

    if (type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Sélectionner...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return <input {...commonProps} type={inputType} />;
  };

  const renderValidationIcon = () => {
    if (!showValidationProgress || !isTouched) return null;

    switch (validationState) {
      case 'validating':
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
      case 'valid':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'invalid':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label
        htmlFor={name}
        className={`
          block text-sm font-medium transition-colors duration-200
          ${validationState === 'invalid' && isTouched ? 'text-red-700' : 'text-gray-700'}
          ${isFocused ? 'text-blue-600' : ''}
        `}
      >
        {label}
        {(required || validation?.required) && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-10">
          {/* Password Toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}

          {/* Validation Icon */}
          {renderValidationIcon()}

          {/* Custom Right Icon */}
          {rightIcon && validationState === 'idle' && (
            <div className="text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      {hint && validationState !== 'invalid' && (
        <p id={`${name}-hint`} className="text-sm text-gray-500 flex items-center space-x-1">
          <Info size={14} />
          <span>{hint}</span>
        </p>
      )}

      {/* Error Message */}
      {error && validationState === 'invalid' && isTouched && (
        <div 
          id={`${name}-error`} 
          className="text-sm text-red-600 flex items-center space-x-1 animate-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {validationState === 'valid' && isTouched && !error && (
        <div className="text-sm text-green-600 flex items-center space-x-1 animate-in slide-in-from-top-1 duration-200">
          <CheckCircle size={16} />
          <span>Valide</span>
        </div>
      )}

      {/* Validation Progress Bar */}
      {showValidationProgress && isTouched && (
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-out ${
              validationState === 'validating' ? 'bg-blue-500 animate-pulse' :
              validationState === 'valid' ? 'bg-green-500' :
              validationState === 'invalid' ? 'bg-red-500' : 'bg-gray-300'
            }`}
            style={{
              width: validationState === 'validating' ? '70%' : 
                     validationState === 'valid' || validationState === 'invalid' ? '100%' : '0%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InstantValidationField;