import React from 'react'
import { formatNumber, formatAPY } from '@/lib/utils'

interface OrderbookEntry {
  id: string
  lender: string
  amount: number
  apy: number
  timestamp: number
}

interface OrderbookPreviewProps {
  orderbook: OrderbookEntry[]
}

export function OrderbookPreview({ orderbook }: OrderbookPreviewProps) {
  const sortedOrderbook = [...orderbook].sort((a, b) => a.apy - b.apy)

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Lender</th>
            <th>Amount (USDC)</th>
            <th>APY</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrderbook.map((entry) => (
            <tr key={entry.id} className="hover:bg-dark-surface/50 transition-colors">
              <td>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-pink to-neon-blue rounded-full flex items-center justify-center">
                    <span className="text-xs font-gaming text-white">
                      {entry.lender.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-sm">
                    {entry.lender}
                  </span>
                </div>
              </td>
              <td>
                <span className="font-gaming text-neon-green">
                  ${formatNumber(entry.amount)}
                </span>
              </td>
              <td>
                <span className="font-gaming text-neon-blue">
                  {formatAPY(entry.apy)}
                </span>
              </td>
              <td>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-neon-green/20 border border-neon-green/50">
                  <div className="w-2 h-2 bg-neon-green rounded-full mr-2 animate-pulse" />
                  <span className="text-xs font-gaming text-neon-green">
                    Available
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedOrderbook.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🎮</div>
          <p className="text-lg font-gaming">No active orders found</p>
          <p className="text-sm">Start lending to see orders here</p>
        </div>
      )}
    </div>
  )
}