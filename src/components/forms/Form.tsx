/**
 * Form Component
 *
 * Wrapper pour react-hook-form avec Zod validation
 */

import * as React from 'react';
import { useForm, FormProvider, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface FormProps<T extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Schema Zod pour la validation */
  schema: z.ZodType<T>;
  /** Valeurs par défaut */
  defaultValues?: Partial<T>;
  /** Handler de soumission */
  onSubmit: SubmitHandler<T>;
  /** Enfants (champs du formulaire) */
  children: React.ReactNode | ((methods: UseFormReturn<T>) => React.ReactNode);
  /** Mode de validation */
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

export function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  mode = 'onBlur',
  ...props
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} {...props}>
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
