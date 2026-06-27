import * as React from 'react';
import { cn } from '../../lib/utils';
import { Field } from './field';
import { FieldLabel } from './field';
import { FieldError } from './field';
import { FieldDescription } from './field';

/**
 * FormField — 三合一输入组件：Label + Input + Error
 *
 * 支持两种用法：
 * 1. register 模式：  <FormField label="名称" error={errors.name?.message} register={register('name')} />
 * 2. Controller 模式：<FormField label="名称" error={fieldState} inputProps={field} />
 * 3. 受控模式：      <FormField label="名称" value={v} onChange={setV} />
 */
export interface FormFieldProps {
  /** 字段 id，同时用于 label htmlFor */
  id?: string;
  /** 标签文字 */
  label: string;
  /** 输入类型 */
  type?: string;
  /** placeholder */
  placeholder?: string;
  /** 自动补全 */
  autoComplete?: string;
  /** 辅助说明 */
  hint?: string;
  /** 错误信息，传字符串或 RHF fieldState（取 fieldState.error?.message） */
  error?: string | { error?: { message?: string } } | undefined;
  /** register() 返回值，与 inputProps 二选一 */
  register?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Controller field 对象或其他 input props，与 register 二选一 */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** 是否 invalid（自动从 error 推导，也可手动传） */
  invalid?: boolean;
  /** 禁用 */
  disabled?: boolean;
  className?: string;
}

const InputStyles =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      autoComplete,
      hint,
      error,
      register,
      inputProps,
      invalid,
      disabled,
      className,
    },
    ref,
  ) => {
    const errorMsg = typeof error === 'string' ? error : error?.error?.message;
    const isInvalid = invalid ?? !!errorMsg;

    return (
      <Field data-invalid={isInvalid || undefined} className={className}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={isInvalid || undefined}
          className={cn(InputStyles)}
          {...(register ?? inputProps)}
        />
        {hint && <FieldDescription>{hint}</FieldDescription>}
        {errorMsg && <FieldError>{errorMsg}</FieldError>}
      </Field>
    );
  },
);
FormField.displayName = 'FormField';
