'use client'

import { DollarSign, TrendingUp, Activity } from 'lucide-react'

interface OrderbookEntry {
  lender: string
  amount: number
  apy: number
  status: 'active' | 'pending' | 'filled'
}

interface OrderbookProps {
  entries: OrderbookEntry[]
}

export function Orderbook({ entries }: OrderbookProps) {
  const formatNumber = (num: number) => num.toLocaleString()
  
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-4 text-sm font-gaming text-gray-400 pb-2 border-b border-gray-700">
        <span>Lender</span>
        <span className="text-right">Amount</span>
        <span className="text-right">APY</span>
        <span className="text-right">Status</span>
      </div>
      
      {entries.map((entry, index) => (
        <div 
          key={index}
          className={`grid grid-cols-4 gap-4 p-3 rounded border transition-colors ${
            entry.status === 'pending' 
              ? 'bg-yellow-900/20 border-yellow-500/30' 
              : 'bg-gray-800/50 border-gray-600/30 hover:border-neon/30'
          }`}
        >
          <span className={entry.lender === 'You' ? 'text-green-400 font-gaming' : ''}>
            {entry.lender}
          </span>
          <span className="text-right font-mono">${formatNumber(entry.amount)}</span>
          <span className="text-right font-gaming text-neon-blue">{entry.apy}%</span>
          <span className={`text-right text-sm capitalize ${
            entry.status === 'active' ? 'text-green-400' : 
            entry.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {entry.status}
          </span>
        </div>
      ))}
    </div>
  )
}