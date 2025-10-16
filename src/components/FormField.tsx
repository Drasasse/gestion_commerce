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

type FormFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const FormField = forwardRef<FormFieldElement, FormFieldProps>(
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

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success);

    const baseClasses = `
      w-full px-3 py-2 border rounded-md transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      default: 'bg-white border-gray-300',
      filled: 'bg-gray-50 border-gray-200',
      outlined: 'bg-transparent border-2 border-gray-300'
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg'
    };

    const stateClasses = hasError
      ? 'border-red-500 focus:ring-red-500'
      : hasSuccess
      ? 'border-green-500 focus:ring-green-500'
      : isFocused
      ? 'border-blue-500'
      : '';

    const inputClasses = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${stateClasses}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || (type === 'password' && showPasswordToggle) ? 'pr-10' : ''}
      ${className}
    `;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      if (onValidate && 'value' in e.target) {
        onValidate(e.target.value);
      }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Cast to match the expected type for onChange prop
      onChange?.(e as any);
      if (onValidate && 'value' in e.target) {
        onValidate(e.target.value);
      }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Cast to match the expected type for onChange prop
      onChange?.(e as any);
      if (onValidate && 'value' in e.target) {
        onValidate(e.target.value);
      }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      // Cast to match the expected type for onBlur prop
      onBlur?.(e as any);
    };

    const handleSelectBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      // Cast to match the expected type for onBlur prop
      onBlur?.(e as any);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const renderInput = () => {
      if (type === 'textarea') {
        // Create textarea-specific props manually to avoid type conflicts
        const textareaProps = {
          id: props.id,
          name: props.name,
          value: props.value,
          defaultValue: props.defaultValue,
          placeholder: props.placeholder,
          disabled: props.disabled,
          readOnly: props.readOnly,
          required: required,
          autoFocus: props.autoFocus,
          tabIndex: props.tabIndex,
          className: inputClasses,
          onChange: handleTextareaChange,
          onBlur: handleTextareaBlur,
          onFocus: handleFocus,
          'aria-invalid': hasError,
          'aria-describedby': `${props.id}-hint ${props.id}-error`,
          rows,
        };

        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...textareaProps}
          />
        );
      }

      if (type === 'select') {
        // Create select-specific props manually to avoid type conflicts
        const selectProps = {
          id: props.id,
          name: props.name,
          value: props.value,
          defaultValue: props.defaultValue,
          disabled: props.disabled,
          required: required,
          autoFocus: props.autoFocus,
          tabIndex: props.tabIndex,
          className: inputClasses,
          onChange: handleSelectChange,
          onBlur: handleSelectBlur,
          onFocus: handleFocus,
          'aria-invalid': hasError,
          'aria-describedby': `${props.id}-hint ${props.id}-error`,
        };

        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            {...selectProps}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      // Default input
      const inputProps = {
        ...props,
        type: type === 'password' && showPassword ? 'text' : type,
        className: inputClasses,
        onChange: handleInputChange,
        onBlur: handleInputBlur,
        onFocus: handleFocus,
        'aria-invalid': hasError,
        'aria-describedby': `${props.id}-hint ${props.id}-error`,
      };

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          {...inputProps}
        />
      );
    };

    return (
      <div className="space-y-1">
        <label
          htmlFor={props.id}
          className={`
            block text-sm font-medium
            ${hasError ? 'text-red-700' : hasSuccess ? 'text-green-700' : 'text-gray-700'}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{leftIcon}</div>
            </div>
          )}

          {renderInput()}

          {(rightIcon || (type === 'password' && showPasswordToggle)) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {type === 'password' && showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              ) : (
                <div className="text-gray-400">{rightIcon}</div>
              )}
            </div>
          )}
        </div>

        {hint && !error && !success && (
          <p id={`${props.id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={16} />
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle size={16} />
            {success}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;