/**
 * Form Component
 *
 * Wrapper pour react-hook-form avec Zod validation
 */

import * as React from 'react';
import { useForm, FormProvider, UseFormReturn, FieldValues, SubmitHandler, DefaultValues, Path } from 'react-hook-form';
import { z } from 'zod';

export interface FormProps<T extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  /** Schema Zod pour la validation */
  schema: z.ZodType<T>;
  /** Valeurs par défaut */
  defaultValues?: DefaultValues<T>;
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
    defaultValues,
    mode,
  });

  const handleSubmit = async (data: T) => {
    try {
      const validatedData = schema.parse(data);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          methods.setError(err.path.join('.') as Path<T>, {
            type: 'manual',
            message: err.message,
          });
        });
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} {...props}>
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
