import * as React from 'react';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/*  Field — core wrapper: direction, invalid state, spacing           */
/* ------------------------------------------------------------------ */

const orientationStyles = {
  vertical: 'flex flex-col gap-1.5',
  horizontal: 'flex flex-row items-center gap-3',
  responsive:
    'flex flex-col gap-1.5 @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3',
} as const;

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'responsive';
  'data-invalid'?: boolean | '';
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ orientation = 'vertical', className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      className={cn(orientationStyles[orientation], className)}
      {...props}
    />
  ),
);
Field.displayName = 'Field';

/* ------------------------------------------------------------------ */
/*  FieldLabel                                                         */
/* ------------------------------------------------------------------ */

export type FieldLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:opacity-70', className)}
      {...props}
    />
  ),
);
FieldLabel.displayName = 'FieldLabel';

/* ------------------------------------------------------------------ */
/*  FieldDescription                                                   */
/* ------------------------------------------------------------------ */

export type FieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
FieldDescription.displayName = 'FieldDescription';

/* ------------------------------------------------------------------ */
/*  FieldError — accepts children or errors[] from react-hook-form    */
/* ------------------------------------------------------------------ */

export interface FieldErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: Array<{ message?: string } | undefined>;
}

const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ errors, className, children, ...props }, ref) => {
    // If explicit children provided, render them
    if (children) {
      return (
        <div ref={ref} className={cn('text-xs text-destructive', className)} {...props}>
          {children}
        </div>
      );
    }

    // If errors array provided, extract messages
    if (errors) {
      const messages = errors
        .filter(Boolean)
        .map((e) => e?.message)
        .filter(Boolean) as string[];

      if (messages.length === 0) return null;

      return (
        <div ref={ref} className={cn('text-xs text-destructive', className)} {...props}>
          {messages.map((msg, i) => (
            <span key={i}>{msg}</span>
          ))}
        </div>
      );
    }

    // No errors and no children — render nothing
    return null;
  },
);
FieldError.displayName = 'FieldError';

/* ------------------------------------------------------------------ */
/*  FieldGroup — stack multiple Field components                       */
/* ------------------------------------------------------------------ */

export type FieldGroupProps = React.HTMLAttributes<HTMLDivElement>;

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-4 @container/field-group', className)}
      {...props}
    />
  ),
);
FieldGroup.displayName = 'FieldGroup';

/* ------------------------------------------------------------------ */
/*  FieldSet — semantic fieldset wrapper                               */
/* ------------------------------------------------------------------ */

export type FieldSetProps = React.FieldsetHTMLAttributes<HTMLFieldSetElement>;

const FieldSet = React.forwardRef<HTMLFieldSetElement, FieldSetProps>(
  ({ className, ...props }, ref) => (
    <fieldset ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
  ),
);
FieldSet.displayName = 'FieldSet';

/* ------------------------------------------------------------------ */
/*  FieldLegend                                                        */
/* ------------------------------------------------------------------ */

export interface FieldLegendProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'legend' | 'label';
}

const FieldLegend = React.forwardRef<HTMLElement, FieldLegendProps>(
  ({ variant = 'legend', className, ...props }, ref) => (
    <legend
      ref={ref as React.LegacyRef<HTMLLegendElement>}
      className={cn(variant === 'label' && 'text-sm font-medium leading-none', className)}
      {...props}
    />
  ),
);
FieldLegend.displayName = 'FieldLegend';

/* ------------------------------------------------------------------ */
/*  FieldContent — groups label + description in horizontal layouts    */
/* ------------------------------------------------------------------ */

export type FieldContentProps = React.HTMLAttributes<HTMLDivElement>;

const FieldContent = React.forwardRef<HTMLDivElement, FieldContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  ),
);
FieldContent.displayName = 'FieldContent';

/* ------------------------------------------------------------------ */
/*  FieldSeparator                                                     */
/* ------------------------------------------------------------------ */

export type FieldSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const FieldSeparator = React.forwardRef<HTMLDivElement, FieldSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 py-2', className)} {...props}>
      <div className="h-px flex-1 bg-border" />
      {children && <span className="text-xs text-muted-foreground">{children}</span>}
      <div className="h-px flex-1 bg-border" />
    </div>
  ),
);
FieldSeparator.displayName = 'FieldSeparator';

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldContent,
  FieldSeparator,
};
