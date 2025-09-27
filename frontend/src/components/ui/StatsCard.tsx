import React from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: React.ReactNode
  title: string
  value: string
  change?: string
  color?: 'neon-green' | 'neon-blue' | 'neon-pink' | 'neon-yellow'
  className?: string
}

export function StatsCard({ 
  icon, 
  title, 
  value, 
  change, 
  color = 'neon-pink',
  className 
}: StatsCardProps) {
  const colorClasses = {
    'neon-green': 'text-neon-green border-neon-green/50 shadow-neon-green/20',
    'neon-blue': 'text-neon-blue border-neon-blue/50 shadow-neon-blue/20',
    'neon-pink': 'text-neon-pink border-neon-pink/50 shadow-neon-pink/20',
    'neon-yellow': 'text-neon-yellow border-neon-yellow/50 shadow-neon-yellow/20'
  }

  return (
    <div className={cn(
      'game-card relative overflow-hidden group hover:scale-105 transition-all duration-300',
      className
    )}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-dark-surface opacity-50" />
      
      <div className="relative z-10">
        <div className={cn(
          'inline-flex p-3 rounded-full mb-4 border-2',
          colorClasses[color]
        )}>
          {icon}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className={cn(
            'text-3xl font-gaming font-bold',
            color === 'neon-green' && 'text-neon-green',
            color === 'neon-blue' && 'text-neon-blue',
            color === 'neon-pink' && 'text-neon-pink',
            color === 'neon-yellow' && 'text-neon-yellow'
          )}>
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-sm font-medium',
              change.startsWith('+') ? 'text-neon-green' : 'text-game-error'
            )}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}