import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn：合并 tailwind class，去重冲突（shadcn/ui 约定）
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
