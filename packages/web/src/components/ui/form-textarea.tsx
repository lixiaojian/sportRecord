import * as React from 'react';
import { cn } from '../../lib/utils';
import { Field } from './field';
import { FieldLabel } from './field';
import { FieldError } from './field';
import { FieldDescription } from './field';

/**
 * FormTextarea — 三合一文本域组件：Label + Textarea + Error
 *
 * 支持两种用法：
 * 1. register 模式：  <FormTextarea label="备注" error={errors.note?.message} register={register('note')} />
 * 2. Controller 模式：<FormTextarea label="备注" error={fieldState} inputProps={field} />
 */
export interface FormTextareaProps {
  id?: string;
  label: string;
  placeholder?: string;
  hint?: string;
  error?: string | { error?: { message?: string } } | undefined;
  register?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  invalid?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

const TextareaStyles =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      id,
      label,
      placeholder,
      hint,
      error,
      register,
      inputProps,
      invalid,
      disabled,
      rows,
      className,
    },
    ref,
  ) => {
    const errorMsg = typeof error === 'string' ? error : error?.error?.message;
    const isInvalid = invalid ?? !!errorMsg;

    return (
      <Field data-invalid={isInvalid || undefined} className={className}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <textarea
          ref={ref}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          aria-invalid={isInvalid || undefined}
          className={cn(TextareaStyles)}
          {...(register ?? inputProps)}
        />
        {hint && <FieldDescription>{hint}</FieldDescription>}
        {errorMsg && <FieldError>{errorMsg}</FieldError>}
      </Field>
    );
  },
);
FormTextarea.displayName = 'FormTextarea';
