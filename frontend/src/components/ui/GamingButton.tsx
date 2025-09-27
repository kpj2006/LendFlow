import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GamingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  icon?: LucideIcon
}

export function GamingButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  className,
  disabled,
  ...props
}: GamingButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-gaming font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95'
  
  const variants = {
    primary: 'bg-gradient-to-r from-game-primary to-neon-pink text-white border border-game-primary hover:shadow-neon-pink focus:ring-game-primary',
    secondary: 'bg-gradient-to-r from-game-secondary to-neon-blue text-white border border-game-secondary hover:shadow-neon-blue focus:ring-game-secondary',
    success: 'bg-gradient-to-r from-game-success to-neon-green text-black border border-game-success hover:shadow-neon-green focus:ring-game-success',
    warning: 'bg-gradient-to-r from-game-warning to-neon-yellow text-black border border-game-warning hover:shadow-yellow-400 focus:ring-game-warning',
    error: 'bg-gradient-to-r from-game-error to-red-500 text-white border border-game-error hover:shadow-red-400 focus:ring-game-error'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-3 text-base rounded-gaming',
    lg: 'px-6 py-4 text-lg rounded-gaming',
    xl: 'px-8 py-5 text-xl rounded-gaming'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isLoading && 'animate-pulse-neon',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {isLoading ? 'Loading...' : children}
    </button>
  )
}