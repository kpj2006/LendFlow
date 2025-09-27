'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Activity,
  RefreshCw,
  Filter,
  TrendingUp,
  Users,
  Search,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { GamingButton } from '@/components/ui/GamingButton'
import { StatsCard } from '@/components/ui/StatsCard'
import { ConnectWalletButton } from '@/components/ui/ConnectWalletButton'
import { formatNumber } from '@/lib/utils'

// Mock orderbook data consistent with your lending system
const mockOrderbook = [
  { id: 'order-1', lender: '0xa1b2c3d4...e5f6', amount: 5000, apy: 3.8, timestamp: Date.now(), status: 'available' as const },
  { id: 'order-2', lender: '0xb2c3d4e5...f6g7', amount: 3200, apy: 3.9, timestamp: Date.now() - 300000, status: 'available' as const },
  { id: 'order-3', lender: '0xc3d4e5f6...g7h8', amount: 7500, apy: 4.0, timestamp: Date.now() - 600000, status: 'matched' as const },
  { id: 'order-4', lender: '0xd4e5f6g7...h8i9', amount: 2800, apy: 4.1, timestamp: Date.now() - 900000, status: 'available' as const },
  { id: 'order-5', lender: '0xe5f6g7h8...i9j0', amount: 4100, apy: 4.2, timestamp: Date.now() - 1200000, status: 'available' as const }
]

interface OrderbookEntry {
  id: string
  lender: string
  amount: number
  apy: number
  timestamp: number
  status: 'available' | 'matched' | 'expired'
}

export default function AnalyticsPage() {
  const [orderbook, setOrderbook] = useState<OrderbookEntry[]>(mockOrderbook)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<'apy' | 'amount' | 'timestamp'>('apy')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'matched'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Generate additional random orders for demo
  useEffect(() => {
    const extendedOrderbook: OrderbookEntry[] = [...mockOrderbook]

    for (let i = 5; i < 20; i++) {
      extendedOrderbook.push({
        id: `order-${i + 1}`,
        lender: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        amount: Math.floor(Math.random() * 200000) + 5000,
        apy: 3.6 + Math.random() * 0.8, // Keep within 3.6% - 4.4% range 
        timestamp: Date.now() - Math.random() * 86400000,
        status: Math.random() > 0.8 ? 'matched' : 'available'
      })
    }

    setOrderbook(extendedOrderbook)
  }, [])

  const refreshData = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const filteredAndSortedOrderbook = orderbook
    .filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false
      if (searchTerm && !order.lender.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'apy':
          comparison = a.apy - b.apy
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'timestamp':
          comparison = a.timestamp - b.timestamp
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: 'apy' | 'amount' | 'timestamp') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const totalLiquidity = orderbook.reduce((sum, order) => 
    order.status === 'available' ? sum + order.amount : sum, 0
  )
  const averageAPY = orderbook.length > 0 ? 
    orderbook.reduce((sum, order) => sum + order.apy, 0) / orderbook.length : 0
  const activeOrders = orderbook.filter(order => order.status === 'available').length

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-md border-b border-dark-border">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <GamingButton variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </GamingButton>
          </Link>
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-neon-cyan" />
            <span className="text-2xl font-gaming text-neon">Liquidity Pool</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <GamingButton 
            variant="success" 
            size="sm" 
            onClick={refreshData}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </GamingButton>
          <ConnectWalletButton />
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-gaming text-neon mb-4">
            LIQUIDITY MATRIX
          </h1>
          <p className="text-xl text-gray-300">
            Real-time orderbook and pool analytics for the gaming protocol
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatsCard
            icon={<Activity className="h-8 w-8" />}
            title="Pool Liquidity"
            value={`$${formatNumber(totalLiquidity)}`}
            change="+12.5%"
            color="neon-blue"
          />
          <StatsCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Avg APY"
            value={`${averageAPY.toFixed(2)}%`}
            change="+0.3%"
            color="neon-blue"
          />
          <StatsCard
            icon={<Users className="h-8 w-8" />}
            title="Active Orders"
            value={activeOrders.toString()}
            change={`+${Math.floor(Math.random() * 10)}`}
            color="neon-green"
          />
          <StatsCard
            icon={<Activity className="h-8 w-8" />}
            title="Total Orders"
            value={orderbook.length.toString()}
            change={`+${Math.floor(Math.random() * 5)}`}
            color="neon-pink"
          />
        </section>

        {/* Controls */}
        <div className="game-card mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="game-input pl-10 pr-4 py-2 w-64"
                  placeholder="Search by lender address..."
                />
              </div>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'matched')}
                className="game-input px-4 py-2"
              >
                <option value="all">All Orders</option>
                <option value="available">Available</option>
                <option value="matched">Matched</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                Showing {filteredAndSortedOrderbook.length} of {orderbook.length} orders
              </span>
            </div>
          </div>
        </div>

        {/* Orderbook Table */}
        <div className="game-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-gaming text-neon-cyan">
              Live Orderbook
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
              <span className="text-sm text-neon-green font-gaming">
                LIVE
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Lender</th>
                  <th 
                    className="cursor-pointer hover:text-neon-blue transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    Amount (USDC)
                    {sortBy === 'amount' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="cursor-pointer hover:text-neon-blue transition-colors"
                    onClick={() => handleSort('apy')}
                  >
                    APY
                    {sortBy === 'apy' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="cursor-pointer hover:text-neon-blue transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    Time
                    {sortBy === 'timestamp' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOrderbook.map((order, index) => (
                  <tr key={order.id} className="hover:bg-dark-surface/50 transition-colors">
                    <td>
                      <div className="flex items-center">
                        <span className="font-gaming text-neon-cyan">
                          #{index + 1}
                        </span>
                        {index < 3 && (
                          <span className="ml-2 text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          order.status === 'available' 
                            ? 'bg-gradient-to-r from-neon-green to-neon-blue' 
                            : 'bg-gradient-to-r from-gray-600 to-gray-800'
                        }`}>
                          <span className="text-xs font-gaming text-white">
                            {order.lender.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono text-sm">
                          {order.lender}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-gaming text-neon-green text-lg">
                        ${formatNumber(order.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`font-gaming text-lg ${
                        order.apy < 6 ? 'text-neon-green' :
                        order.apy < 7.5 ? 'text-neon-blue' : 'text-neon-pink'
                      }`}>
                        {order.apy.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-400">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                    <td>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-gaming ${
                        order.status === 'available' 
                          ? 'bg-neon-green/20 border border-neon-green/50 text-neon-green'
                          : 'bg-gray-600/20 border border-gray-600/50 text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          order.status === 'available' ? 'bg-neon-green animate-pulse' : 'bg-gray-400'
                        }`} />
                        {order.status.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      {order.status === 'available' ? (
                        <Link href={`/borrow?amount=${order.amount}`}>
                          <GamingButton variant="primary" size="sm">
                            Match
                          </GamingButton>
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedOrderbook.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg font-gaming">No orders found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/lend">
            <div className="game-card hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-gaming text-neon-green mb-2">
                  Start Lending
                </h3>
                <p className="text-gray-400">
                  Add your USDC to the liquidity pool and start earning
                </p>
              </div>
            </div>
          </Link>

          <Link href="/borrow">
            <div className="game-card hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-gaming text-neon-blue mb-2">
                  Borrow Funds
                </h3>
                <p className="text-gray-400">
                  Get matched with lenders at competitive rates
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}