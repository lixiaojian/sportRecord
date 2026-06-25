import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
  className?: string;
}

/**
 * 表单字段：label + input，统一 shadcn 风格。RHF 接入留待阶段 6。
 */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ id, label, value, onChange, type = 'text', autoComplete, hint, className }, ref) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        type={type}
        autoComplete={autoComplete}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  ),
);
Field.displayName = 'Field';
