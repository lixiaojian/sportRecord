import * as React from 'react';
import { cn } from '../../lib/utils';
import { Field } from './field';
import { FieldLabel } from './field';
import { FieldError } from './field';
import { FieldDescription } from './field';

/**
 * FormSelect — 三合一选择组件：Label + Select + Error
 *
 * 支持两种用法：
 * 1. register 模式：  <FormSelect label="分类" options={[...]} error={errors.cat?.message} register={register('cat')} />
 * 2. Controller 模式：<FormSelect label="分类" options={[...]} error={fieldState} value={field.value} onChange={field.onChange} />
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  id?: string;
  label: string;
  /** 选项列表，格式 [{ value, label }] */
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string | { error?: { message?: string } } | undefined;
  /** register() 返回值（与 value/onChange 二选一） */
  register?: React.SelectHTMLAttributes<HTMLSelectElement>;
  /** Controller field 或受控 props（与 register 二选一） */
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

const SelectStyles =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      id,
      label,
      options,
      placeholder,
      hint,
      error,
      register,
      value,
      onChange,
      onBlur,
      invalid,
      disabled,
      className,
    },
    ref,
  ) => {
    const errorMsg = typeof error === 'string' ? error : error?.error?.message;
    const isInvalid = invalid ?? !!errorMsg;

    const controlledProps =
      value !== undefined || onChange !== undefined ? { value, onChange, onBlur } : undefined;

    return (
      <Field data-invalid={isInvalid || undefined} className={className}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={isInvalid || undefined}
          className={cn(SelectStyles)}
          {...(register ?? controlledProps)}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && <FieldDescription>{hint}</FieldDescription>}
        {errorMsg && <FieldError>{errorMsg}</FieldError>}
      </Field>
    );
  },
);
FormSelect.displayName = 'FormSelect';
