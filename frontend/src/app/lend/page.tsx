'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Shield, Info, Activity, DollarSign, Zap, CheckCircle2 } from 'lucide-react'
import { GamingButton } from '@/components/ui/GamingButton'
import { StatsCard } from '@/components/ui/StatsCard'
import { Orderbook } from '@/components/orderbook/Orderbook'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

// Mock RedStone APY feeds
const mockAPYFeeds = {
  aave: 3.9,
  maker: 4.0,
  compound: 3.8
}

// Calculate reference APY (30% Aave + 70% Maker)
const calculateReferenceAPY = () => {
  return (0.3 * mockAPYFeeds.aave + 0.7 * mockAPYFeeds.maker)
}

// APY range with delta tolerance ±0.2%
const getAPYRange = () => {
  const refAPY = calculateReferenceAPY()
  const delta = 0.2
  return {
    min: (refAPY - delta),
    max: (refAPY + delta),
    reference: refAPY
  }
}

export default function LendPage() {
  const [amount, setAmount] = useState('')
  const [desiredAPY, setDesiredAPY] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apyRange, setApyRange] = useState(getAPYRange())
  const [referenceAPY, setReferenceAPY] = useState(calculateReferenceAPY())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Mock orderbook entries
  const [orderbookEntries, setOrderbookEntries] = useState<Array<{
    lender: string
    amount: number
    apy: number
    status: 'active' | 'pending' | 'filled'
  }>>([
    { lender: 'Lender A', amount: 5000, apy: 3.8, status: 'active' },
    { lender: 'Lender B', amount: 3200, apy: 3.9, status: 'active' },
    { lender: 'Lender C', amount: 7500, apy: 4.0, status: 'active' },
    { lender: 'Lender D', amount: 2800, apy: 4.1, status: 'active' },
    { lender: 'Lender E', amount: 4100, apy: 4.2, status: 'active' }
  ])

  // Simulate RedStone updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small fluctuations
      mockAPYFeeds.aave += (Math.random() - 0.5) * 0.1
      mockAPYFeeds.maker += (Math.random() - 0.5) * 0.1
      
      setReferenceAPY(calculateReferenceAPY())
      setApyRange(getAPYRange())
      setLastUpdate(new Date())
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const validateAPY = (apy: number) => {
    return apy >= apyRange.min && apy <= apyRange.max
  }

  const handleAddLiquidity = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!desiredAPY || parseFloat(desiredAPY) <= 0) {
      toast.error('Please enter your desired APY')
      return
    }

    const apyValue = parseFloat(desiredAPY)
    if (!validateAPY(apyValue)) {
      toast.error(`APY must be between ${apyRange.min.toFixed(2)}% and ${apyRange.max.toFixed(2)}%`)
      return
    }

    setIsLoading(true)
    
    // Simulate adding to orderbook
    setTimeout(() => {
      const newEntry = {
        lender: 'You',
        amount: parseFloat(amount),
        apy: apyValue,
        status: 'pending' as const
      }
      
      setOrderbookEntries(prev => [...prev, newEntry].sort((a, b) => a.apy - b.apy))
      
      toast.success(`Added ${amount} USDC at ${desiredAPY}% APY to orderbook!`)
      setAmount('')
      setDesiredAPY('')
      setIsLoading(false)
    }, 2000)
  }

  const totalLiquidity = orderbookEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const averageAPY = orderbookEntries.reduce((sum, entry) => sum + (entry.apy * entry.amount), 0) / totalLiquidity
  
  return (
    <div className="min-h-screen bg-dark text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-game-dark via-gray-900 to-black opacity-50" />
      <div className="grid-background opacity-10" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <GamingButton variant="secondary" size="sm">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </GamingButton>
          </Link>
          <div>
            <h1 className="text-4xl font-gaming bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
              Lending Orderbook
            </h1>
            <p className="text-gray-400 mt-2">
              Add liquidity at your desired fixed APY • Instant RedStone price feeds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: APY Feed & Add Liquidity */}
          <div className="lg:col-span-1 space-y-6">
            {/* RedStone APY Feeds */}
            <div className="game-card">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-neon-green" />
                <h2 className="text-xl font-gaming text-neon-green">RedStone APY Feeds</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded border-l-4 border-blue-500">
                  <span className="text-gray-300">Aave v3 USDC</span>
                  <span className="font-gaming text-blue-400">{mockAPYFeeds.aave.toFixed(2)}%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded border-l-4 border-purple-500">
                  <span className="text-gray-300">MakerDAO DSR</span>
                  <span className="font-gaming text-purple-400">{mockAPYFeeds.maker.toFixed(2)}%</span>
                </div>
                
                <div className="border-t border-gray-700 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Reference APY</span>
                    <span className="font-gaming text-neon font-bold">{referenceAPY.toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    30% Aave + 70% Maker
                  </div>
                </div>
                
                <div className="bg-gray-800/70 p-3 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Allowed Range:</span>
                    <span className="text-neon-pink font-gaming text-sm">
                      {apyRange.min.toFixed(2)}% - {apyRange.max.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Liquidity Form */}
            <div className="game-card">
              <h2 className="text-xl font-gaming text-neon-pink mb-4">Add Liquidity</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded font-gaming
                             focus:border-neon-pink focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Desired APY (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="3.95"
                    value={desiredAPY}
                    onChange={(e) => setDesiredAPY(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded font-gaming
                             focus:border-neon-pink focus:outline-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Must be between {apyRange.min.toFixed(2)}% and {apyRange.max.toFixed(2)}%
                  </div>
                </div>

                <GamingButton 
                  onClick={handleAddLiquidity}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Adding to Orderbook...' : 'Add Liquidity'}
                </GamingButton>
              </div>
            </div>
          </div>

          {/* Right: Orderbook & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="Total Liquidity"
                value={`$${formatNumber(totalLiquidity)}`}
                icon={<DollarSign className="w-5 h-5" />}
                change={`${orderbookEntries.length} orders`}
              />
              
              <StatsCard
                title="Average APY"
                value={`${averageAPY.toFixed(2)}%`}
                icon={<TrendingUp className="w-5 h-5" />}
                change="Weighted avg"
              />
              
              <StatsCard
                title="Reference Rate"
                value={`${referenceAPY.toFixed(2)}%`}
                icon={<Activity className="w-5 h-5" />}
                change="Live RedStone"
              />
            </div>

            {/* Live Orderbook */}
            <div className="game-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-gaming text-neon-blue">Live Orderbook</h2>
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm">Live</span>
                </div>
              </div>

              <Orderbook entries={orderbookEntries} />

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded border border-blue-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span className="font-gaming text-blue-400">Matching Logic</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• <strong>Small borrowers:</strong> Matched from lowest APY → highest APY</p>
                  <p>• <strong>Whale borrowers:</strong> Matched from highest APY → lowest APY</p>
                  <p>• Final rate = weighted average of used liquidity chunks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
