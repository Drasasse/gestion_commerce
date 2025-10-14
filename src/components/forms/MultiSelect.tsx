'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayed?: number;
  allowSearch?: boolean;
}

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Sélectionner des options...',
  searchPlaceholder = 'Rechercher...',
  className = '',
  disabled = false,
  maxDisplayed = 3,
  allowSearch = true
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleOption = useCallback((optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange?.(newValue);
  }, [value, onChange]);

  const handleRemoveOption = useCallback((optionValue: string) => {
    const newValue = value.filter(v => v !== optionValue);
    onChange?.(newValue);
  }, [value, onChange]);

  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions
      .filter(option => !option.disabled)
      .map(option => option.value);
    onChange?.(allValues);
  }, [filteredOptions, onChange]);

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  const getSelectedLabels = () => {
    return value
      .map(v => options.find(opt => opt.value === v)?.label)
      .filter(Boolean) as string[];
  };

  const selectedLabels = getSelectedLabels();
  const displayedLabels = selectedLabels.slice(0, maxDisplayed);
  const remainingCount = selectedLabels.length - maxDisplayed;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full justify-between h-auto min-h-[40px] p-2 ${
          value.length > 0 ? 'text-left' : ''
        }`}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <>
              {displayedLabels.map((label, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const optionValue = value[index];
                    if (optionValue) {
                      handleRemoveOption(optionValue);
                    }
                  }}
                >
                  {label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingCount} autres
                </Badge>
              )}
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          {/* Search */}
          {allowSearch && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleSelectAll}
              className="h-6 text-xs"
            >
              Tout sélectionner
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="h-6 text-xs"
            >
              Tout désélectionner
            </Button>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Aucune option trouvée
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`
                    flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !option.disabled && handleToggleOption(option.value)}
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    disabled={option.disabled}
                    onChange={() => !option.disabled && handleToggleOption(option.value)}
                  />
                  <span className="flex-1 text-sm">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}