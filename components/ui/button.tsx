'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const variantClasses = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  outline: 'border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800',
  ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600',
  link: 'text-indigo-400 underline-offset-4 hover:underline bg-transparent p-0',
}

const sizeClasses = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-7 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
