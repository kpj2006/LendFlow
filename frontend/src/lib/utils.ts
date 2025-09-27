import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B'
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M'
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K'
  }
  return value.toFixed(decimals)
}

export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getBorrowerType(amount: number): 'small' | 'whale' {
  return amount >= 10000 ? 'whale' : 'small'
}

export function generateMockData() {
  return {
    stableAPY: 7.25,
    totalLiquidity: 12500000,
    totalBorrowed: 8900000,
    activeUsers: 1337,
    orderbook: [
      { id: '1', lender: '0x1234...5678', amount: 50000, apy: 6.5, timestamp: Date.now() },
      { id: '2', lender: '0x2345...6789', amount: 25000, apy: 6.8, timestamp: Date.now() },
      { id: '3', lender: '0x3456...789a', amount: 100000, apy: 7.2, timestamp: Date.now() },
      { id: '4', lender: '0x4567...89ab', amount: 75000, apy: 7.5, timestamp: Date.now() },
    ]
  }
}