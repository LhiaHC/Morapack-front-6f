import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases Tailwind sin colisiones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea números con separadores de miles. */
export const nf = (n: number) =>
  new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(n)

/** Sleep sencillo para demos/simulaciones. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
