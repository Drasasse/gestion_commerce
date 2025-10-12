import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  disabled = false,
  error,
  className = ''
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        w-full px-3 py-2 border rounded-md
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}