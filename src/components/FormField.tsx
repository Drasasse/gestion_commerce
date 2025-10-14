import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  rows?: number;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onValidate?: (value: string) => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    label,
    error,
    success,
    hint,
    required,
    type = 'text',
    options = [],
    rows = 3,
    showPasswordToggle = false,
    leftIcon,
    rightIcon,
    onValidate,
    variant = 'default',
    size = 'md',
    className = '',
    onChange,
    onBlur,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    // Classes de base
    const baseClasses = `
      w-full transition-all duration-200 ease-in-out
      border rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
      ${hasSuccess ? 'border-green-500 focus:ring-green-500' : ''}
      ${!hasError && !hasSuccess ? 'border-gray-300 hover:border-gray-400' : ''}
    `;

    // Classes selon la variante
    const variantClasses = {
      default: 'bg-white',
      filled: 'bg-gray-50 border-transparent focus:bg-white',
      outlined: 'bg-transparent border-2'
    };

    // Classes selon la taille
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    const inputClasses = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || showPasswordToggle || hasError || hasSuccess ? 'pr-10' : ''}
      ${className}
    `;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange?.(e);
      if (onValidate && 'value' in e.target) {
        onValidate(e.target.value);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const renderInput = () => {
      const commonProps = {
        ...props,
        className: inputClasses,
        onChange: handleChange,
        onBlur: handleBlur,
        onFocus: handleFocus,
        'aria-invalid': hasError,
        'aria-describedby': `${props.id}-hint ${props.id}-error`,
      };

      if (type === 'textarea') {
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...commonProps}
          />
        );
      }

      if (type === 'select') {
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            {...commonProps}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={inputType}
          {...commonProps}
        />
      );
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        <label
          htmlFor={props.id}
          className={`
            block text-sm font-medium transition-colors duration-200
            ${hasError ? 'text-red-700' : 'text-gray-700'}
            ${isFocused ? 'text-blue-600' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          {renderInput()}

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Password Toggle */}
            {type === 'password' && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}

            {/* Success Icon */}
            {hasSuccess && (
              <CheckCircle size={20} className="text-green-500" />
            )}

            {/* Error Icon */}
            {hasError && (
              <AlertCircle size={20} className="text-red-500" />
            )}

            {/* Custom Right Icon */}
            {rightIcon && !hasError && !hasSuccess && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Hint */}
        {hint && !error && !success && (
          <p id={`${props.id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className="text-sm text-green-600 flex items-center space-x-1">
            <CheckCircle size={16} />
            <span>{success}</span>
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle size={16} />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;