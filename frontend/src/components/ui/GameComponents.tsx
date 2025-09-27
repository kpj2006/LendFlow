import React from 'react'
import { cn } from '@/lib/utils'

interface BorrowerBadgeProps {
  type: 'small' | 'whale'
  className?: string
}

export function BorrowerBadge({ type, className }: BorrowerBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full font-gaming text-sm font-semibold',
      type === 'whale' 
        ? 'bg-gradient-to-r from-neon-pink to-purple-500 text-white shadow-neon-pink' 
        : 'bg-gradient-to-r from-neon-green to-green-400 text-black shadow-neon-green',
      className
    )}>
      <span className="mr-1 text-base">
        {type === 'whale' ? '🐋' : '🪙'}
      </span>
      {type === 'whale' ? 'WHALE' : 'SMALL'}
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success'
}

export function LoadingSpinner({ size = 'md', color = 'primary' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  const colorClasses = {
    primary: 'border-neon-pink',
    secondary: 'border-neon-blue',
    success: 'border-neon-green'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-transparent',
      sizeClasses[size],
      colorClasses[color]
    )}
    style={{
      borderTopColor: 'currentColor',
      borderRightColor: 'currentColor'
    }}
    />
  )
}

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onClose?: () => void
}

export function Notification({ type, title, message, onClose }: NotificationProps) {
  const typeConfig = {
    success: {
      icon: '✅',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/50',
      textColor: 'text-neon-green'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-400'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-400'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-neon-blue/10',
      borderColor: 'border-neon-blue/50',
      textColor: 'text-neon-blue'
    }
  }

  const config = typeConfig[type]

  return (
    <div className={cn(
      'p-4 rounded-gaming border backdrop-blur-sm',
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-start space-x-3">
        <span className="text-lg flex-shrink-0">
          {config.icon}
        </span>
        <div className="flex-1">
          <h4 className={cn('font-gaming font-semibold', config.textColor)}>
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-300 mt-1">
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning'
  showPercentage?: boolean
}

export function ProgressBar({ 
  value, 
  max, 
  label, 
  color = 'primary', 
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = (value / max) * 100
  
  const colorClasses = {
    primary: 'from-neon-pink to-purple-500',
    secondary: 'from-neon-blue to-blue-500',
    success: 'from-neon-green to-green-500',
    warning: 'from-neon-yellow to-yellow-500'
  }

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-gaming text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm font-gaming text-white">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-dark-surface rounded-gaming h-3 overflow-hidden">
        <div
          className={cn(
            'h-full bg-gradient-to-r transition-all duration-500 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}