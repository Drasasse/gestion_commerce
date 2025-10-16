'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Save, X } from 'lucide-react';

type FormFieldValue = string | number | boolean | Date | null | undefined;

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: FormFieldValue) => string | null;
  defaultValue?: FormFieldValue;
  description?: string;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface AdvancedFormProps {
  sections: FormSection[];
  onSubmit?: (data: Record<string, FormFieldValue>) => Promise<void>;
  onCancel?: () => void;
  initialData?: Record<string, FormFieldValue>;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  allowDynamicFields?: boolean;
}

export default function AdvancedForm({
  sections,
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  className = '',
  allowDynamicFields = false
}: AdvancedFormProps) {
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<Record<string, FormField[]>>({});

  const updateField = useCallback((name: string, value: FormFieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    sections.forEach(section => {
      [...section.fields, ...(dynamicFields[section.title] || [])].forEach(field => {
        const value = formData[field.name];

        // Required field validation
        if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
          newErrors[field.name] = `${field.label} est requis`;
          return;
        }

        // Custom validation
        if (field.validation && value) {
          const validationError = field.validation(value);
          if (validationError) {
            newErrors[field.name] = validationError;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sections, formData, dynamicFields]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const addDynamicField = useCallback((sectionTitle: string) => {
    const newField: FormField = {
      name: `dynamic_${Date.now()}`,
      label: 'Nouveau champ',
      type: 'text',
      required: false
    };

    setDynamicFields(prev => ({
      ...prev,
      [sectionTitle]: [...(prev[sectionTitle] || []), newField]
    }));
  }, []);

  const removeDynamicField = useCallback((sectionTitle: string, fieldIndex: number) => {
    setDynamicFields(prev => ({
      ...prev,
      [sectionTitle]: (prev[sectionTitle] || []).filter((_, index) => index !== fieldIndex)
    }));
  }, []);

  const renderField = useCallback((field: FormField, isDynamic = false, sectionTitle?: string, fieldIndex?: number) => {
    const value = formData[field.name] || field.defaultValue || '';
    const error = errors[field.name];

    const fieldElement = (() => {
      switch (field.type) {
        case 'textarea':
          return (
            <Textarea
              value={String(value || '')}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
          );

        case 'select':
          return (
            <Select 
              value={String(value || '')} 
              onChange={(val) => updateField(field.name, val)}
              options={field.options || []}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
          );

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={Boolean(value)}
                onCheckedChange={(checked) => updateField(field.name, checked)}
              />
              <Label>{field.label}</Label>
            </div>
          );

        case 'radio':
          return (
            <RadioGroup value={String(value || '')} onValueChange={(val) => updateField(field.name, val)}>
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} />
                  <Label>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          );

        default:
          return (
            <Input
              type={field.type}
              value={String(value || '')}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
          );
      }
    })();

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center justify-between">
          {field.type !== 'checkbox' && (
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {isDynamic && sectionTitle && fieldIndex !== undefined && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeDynamicField(sectionTitle, fieldIndex)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {fieldElement}
        
        {field.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
        )}
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }, [formData, errors, updateField, removeDynamicField]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {sections.map((section, sectionIndex) => (
        <Card key={section.title}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {section.description}
                  </p>
                )}
              </div>
              {allowDynamicFields && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addDynamicField(section.title)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un champ
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map(field => renderField(field))}
            
            {dynamicFields[section.title]?.map((field, index) => 
              renderField(field, true, section.title, index)
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}