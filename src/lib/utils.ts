import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add/Export a robust Indian currency formatter usable across all components
export function formatIndianCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '₹0';
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)} K`;
  return `₹${Math.floor(value)}`;
}
