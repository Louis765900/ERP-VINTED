'use client'
import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        'relative w-full rounded-xl border border-gray-700 bg-gray-900 shadow-2xl',
        sizeClasses[size]
      )}>
        <div className="flex items-start justify-between border-b border-gray-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
