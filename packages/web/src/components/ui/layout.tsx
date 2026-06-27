import * as React from 'react';
import { cn } from '../../lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  inline?: boolean;
}

const directionMap = { row: 'flex-row', col: 'flex-col' } as const;
const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const;
const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const;
const gapMap = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
} as const;

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ direction = 'col', gap, align, justify, wrap, inline, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        inline ? 'inline-flex' : 'flex',
        directionMap[direction],
        gap !== undefined && gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    />
  ),
);
Stack.displayName = 'Stack';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6;
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
}

const gridColsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
} as const;
const gridColsMdMap = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
} as const;
const gridColsLgMap = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
} as const;

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ cols, colsMd, colsLg, gap, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid',
        gap !== undefined && gapMap[gap],
        cols && gridColsMap[cols],
        colsMd && gridColsMdMap[colsMd],
        colsLg && gridColsLgMap[colsLg],
        className,
      )}
      {...props}
    />
  ),
);
Grid.displayName = 'Grid';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
} as const;

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'xl', className, ...props }, ref) => (
    <div ref={ref} className={cn('mx-auto w-full px-4', sizeMap[size], className)} {...props} />
  ),
);
Container.displayName = 'Container';

export { Stack, Grid, Container };
