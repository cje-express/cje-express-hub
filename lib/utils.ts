import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DEADLINE_WARNING_DAYS } from './constants'
import type { DemandStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function isDeadlineNear(
  deadlineDate: string | null | undefined,
  status: DemandStatus
): boolean {
  if (!deadlineDate) return false
  if (['concluido', 'arquivado', 'cancelado'].includes(status)) return false
  const deadline = parseISO(deadlineDate)
  const warningThreshold = addDays(new Date(), DEADLINE_WARNING_DAYS)
  return !isAfter(deadline, warningThreshold) && isAfter(deadline, new Date())
}

export function generateProtocolNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `CJE-${year}${month}${day}-${random}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function isAdminCJE(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN_CJE' || role === 'OPERADOR_CJE'
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN_CJE'
}

export function isClientAdmin(role: string | undefined): boolean {
  return role === 'ADMIN_CLIENTE'
}

export function canEditDemand(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN_CJE'
}

export function canChangeStatus(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN_CJE'
}
