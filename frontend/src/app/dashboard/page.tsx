'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  ArrowLeft,
  Gamepad2,
  RefreshCw
} from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { GamingButton } from '@/components/ui/GamingButton'
import { APYChart } from '@/components/charts/APYChart'
import { OrderbookPreview } from '@/components/orderbook/OrderbookPreview'
import { generateMockData } from '@/lib/utils'

export default function Dashboard() {
  const [data, setData] = useState(generateMockData())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setData(generateMockData())
    setIsRefreshing(false)
  }

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-md border-b border-dark-border">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <GamingButton variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </GamingButton>
          </Link>
          <div className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-neon-pink" />
            <span className="text-2xl font-gaming text-neon">Dashboard</span>
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
          <GamingButton variant="primary" size="sm">
            Connect Wallet
          </GamingButton>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-gaming text-neon mb-4">
            COMMAND CENTER
          </h1>
          <p className="text-xl text-gray-300">
            Monitor your DeFi gaming protocol performance in real-time
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            icon={<DollarSign className="h-8 w-8" />}
            title="Total Liquidity"
            value={`$${(data.totalLiquidity / 1000000).toFixed(1)}M`}
            change="+23.4%"
            color="neon-green"
          />
          <StatsCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Stable APY"
            value={`${data.stableAPY.toFixed(2)}%`}
            change="+0.12%"
            color="neon-blue"
          />
          <StatsCard
            icon={<Activity className="h-8 w-8" />}
            title="Total Borrowed"
            value={`$${(data.totalBorrowed / 1000000).toFixed(1)}M`}
            change="+8.7%"
            color="neon-pink"
          />
          <StatsCard
            icon={<Users className="h-8 w-8" />}
            title="Active Users"
            value={data.activeUsers.toLocaleString()}
            change="+156"
            color="neon-yellow"
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* APY Chart */}
          <div className="lg:col-span-2">
            <div className="game-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-gaming text-neon-blue">
                  Hybrid APY Tracking
                </h2>
                <div className="flex space-x-2">
                  <span className="text-sm text-gray-400">Maker + Aave</span>
                </div>
              </div>
              <APYChart />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="game-card">
              <h3 className="text-xl font-gaming text-neon-pink mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/lend">
                  <GamingButton variant="primary" size="md" className="w-full">
                    Start Lending
                  </GamingButton>
                </Link>
                <Link href="/borrow">
                  <GamingButton variant="secondary" size="md" className="w-full">
                    Borrow Funds
                  </GamingButton>
                </Link>
                <Link href="/lend">
                  <GamingButton variant="success" size="md" className="w-full">
                    Add Liquidity
                  </GamingButton>
                </Link>
              </div>
            </div>

            {/* Protocol Health */}
            <div className="game-card">
              <h3 className="text-xl font-gaming text-neon-green mb-4">
                Protocol Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Utilization Rate</span>
                  <span className="text-neon-green font-semibold">
                    {((data.totalBorrowed / data.totalLiquidity) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-dark-surface rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(data.totalBorrowed / data.totalLiquidity) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  Available: ${((data.totalLiquidity - data.totalBorrowed) / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orderbook Preview */}
        <section>
          <div className="game-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-gaming text-neon-pink">
                Live Orderbook
              </h2>
              <Link href="/lend">
                <GamingButton variant="secondary" size="sm">
                  View Orderbook
                </GamingButton>
              </Link>
            </div>
            <OrderbookPreview orderbook={data.orderbook} />
          </div>
        </section>
      </div>
    </main>
  )
}