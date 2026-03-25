import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `FAC-${year}${month}-${random}`
}

export const PRODUCT_STATUSES = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'emerald' },
  { value: 'RESERVE', label: 'Réservé', color: 'amber' },
  { value: 'PUBLIE', label: 'Publié', color: 'blue' },
  { value: 'A_EXPEDIER', label: 'À expédier', color: 'orange' },
  { value: 'EN_LIVRAISON', label: 'En livraison', color: 'purple' },
  { value: 'LIVRE', label: 'Livré', color: 'indigo' },
  { value: 'VENDU', label: 'Vendu', color: 'green' },
  { value: 'ARCHIVE', label: 'Archivé', color: 'gray' },
] as const

export const ROLES = {
  PATRON: 'Patron',
  VENDEUR: 'Vendeur',
  GESTIONNAIRE: 'Gestionnaire',
} as const

export const PLATFORMS = ['Vinted', 'Leboncoin', 'eBay', 'Facebook', 'Instagram', 'Autre'] as const

export const CATEGORIES = [
  'Vêtements femme', 'Vêtements homme', 'Vêtements enfant',
  'Chaussures', 'Accessoires', 'Sacs', 'Bijoux',
  'Électronique', 'Maison', 'Sport', 'Livres', 'Autre'
] as const

export const COMMISSION_RATE = 0.25
