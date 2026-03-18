import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with thousands separator
 */
export function formatCount(count: number): string {
  if (count === undefined || count === null || isNaN(count)) {
    return '0';
  }
  return count.toLocaleString();
}

/**
 * Format delta percentage for display with sign
 */
export function formatDelta(delta: number): string {
  if (delta === undefined || delta === null || isNaN(delta)) {
    return '0.0%';
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}
