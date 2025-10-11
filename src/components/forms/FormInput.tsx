/**
 * FormInput Component
 *
 * Input intégré avec react-hook-form
 */

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input, InputProps } from '@/components/ui/Input';

export interface FormInputProps extends Omit<InputProps, 'name'> {
  name: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, ...props }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name];
    const errorMessage = error?.message as string | undefined;

    return (
      <Input
        {...register(name)}
        {...props}
        ref={ref}
        error={errorMessage}
        aria-invalid={!!error}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
