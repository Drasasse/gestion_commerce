'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X, ChevronDown } from 'lucide-react';

export interface AutoCompleteOption {
  value: string;
  label: string;
  description?: string;
}

export interface AutoCompleteProps {
  options: AutoCompleteOption[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: AutoCompleteOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
  minSearchLength?: number;
  maxResults?: number;
  loading?: boolean;
  onSearch?: (searchTerm: string) => void;
}

export default function AutoComplete({
  options,
  value = '',
  onChange,
  onSelect,
  placeholder = 'Tapez pour rechercher...',
  className = '',
  disabled = false,
  allowCustomValue = true,
  minSearchLength = 1,
  maxResults = 10,
  loading = false,
  onSearch
}: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options
    .filter(option => 
      searchTerm.length >= minSearchLength &&
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, maxResults);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (onSearch && searchTerm.length >= minSearchLength) {
      onSearch(searchTerm);
    }
  }, [searchTerm, onSearch, minSearchLength]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange?.(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleOptionSelect = useCallback((option: AutoCompleteOption) => {
    setSearchTerm(option.label);
    onChange?.(option.value);
    onSelect?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange, onSelect]);

  const handleInputFocus = useCallback(() => {
    if (searchTerm.length >= minSearchLength) {
      setIsOpen(true);
    }
  }, [searchTerm, minSearchLength]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow option selection
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustomValue && searchTerm) {
          onChange?.(searchTerm);
          setIsOpen(false);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, handleOptionSelect, allowCustomValue, searchTerm, onChange]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onChange?.('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 pr-10 ${isOpen ? 'rounded-b-none' : ''}`}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchTerm && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 p-0 mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="pr-3">
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          <div ref={listRef}>
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Chargement...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm.length < minSearchLength 
                  ? `Tapez au moins ${minSearchLength} caractère${minSearchLength > 1 ? 's' : ''}`
                  : 'Aucun résultat trouvé'
                }
                {allowCustomValue && searchTerm.length >= minSearchLength && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onChange?.(searchTerm);
                        setIsOpen(false);
                      }}
                    >
                      Utiliser &quot;{searchTerm}&quot;
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    className={`
                      p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0
                      ${index === highlightedIndex 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                ))}
                
                {allowCustomValue && searchTerm && !filteredOptions.some(opt => opt.label === searchTerm) && (
                  <div
                    className={`
                      p-3 cursor-pointer border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700
                      ${highlightedIndex === filteredOptions.length 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                    onClick={() => {
                      onChange?.(searchTerm);
                      setIsOpen(false);
                    }}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Utiliser &quot;{searchTerm}&quot;
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Créer une nouvelle entrée
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}