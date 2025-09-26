'use client'

import { useContractRead } from 'wagmi'
import { formatUnits } from 'ethers'
import { TrendingUp, Users, DollarSign, Activity, Bitcoin, Database, Zap } from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES } from '../hooks/useContract'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL

export default function PoolStatus() {
  // Get enhanced pool status
  const { data: poolStatus } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStatus',
    watch: true
  })

  // Get stable APY
  const { data: stableAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getStableAPY',
    watch: true
  })

  // Get protocol metrics
  const { data: protocolMetrics } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getProtocolMetrics',
    watch: true
  })

  const formatUSDC = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 6)
  }

  const formatAPY = (apyValue) => {
    if (!apyValue) return '0.00%'
    // Convert from ray (1e27) to percentage
    const percentage = (Number(apyValue) / 1e27) * 100
    return `${percentage.toFixed(2)}%`
  }

  const formatBTC = (amount) => {
    if (!amount) return '0.00000000'
    return formatUnits(amount, 8)
  }

  const stats = [
    {
      name: 'Total Available Liquidity',
      value: poolStatus ? formatUSDC(poolStatus[0]) : '0.00',
      unit: 'USDC',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Lent Amount',
      value: poolStatus ? formatUSDC(poolStatus[1]) : '0.00',
      unit: 'USDC',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Active Lenders',
      value: poolStatus ? poolStatus[2]?.toString() : '0',
      unit: '',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Active Borrowers',
      value: poolStatus ? poolStatus[3]?.toString() : '0',
      unit: '',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Average APY',
      value: poolStatus ? (Number(poolStatus[4]) / 100).toFixed(2) + '%' : '0.00%',
      unit: '',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Total Interest Earned',
      value: poolStatus ? formatUSDC(poolStatus[5]) : '0.00',
      unit: 'USDC',
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  const protocolStats = [
    {
      name: 'BTC Collateral Locked',
      value: poolStatus ? formatBTC(poolStatus[6]) : '0.00000000',
      unit: 'BTC',
      icon: Bitcoin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Walrus Rewards Pool',
      value: poolStatus ? formatUSDC(poolStatus[7]) : '0.00',
      unit: 'WAL',
      icon: Database,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      name: 'Cross-Chain Loans',
      value: poolStatus ? poolStatus[8]?.toString() : '0',
      unit: '',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Pool Overview */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pool Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {stat.unit && <span className="text-lg text-gray-500 ml-1">{stat.unit}</span>}
                </div>
                <div className="text-sm text-gray-600">{stat.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Protocol Enhancements */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Enhancements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {protocolStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {stat.unit && <span className="text-lg text-gray-500 ml-1">{stat.unit}</span>}
                </div>
                <div className="text-sm text-gray-600">{stat.name}</div>
              </div>
            )
          })}
        </div>

        {/* Stable APY Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Stable APY (MakerDAO DSR + Aave)</h4>
              <p className="text-3xl font-bold text-gray-900">{formatAPY(stableAPY)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Hybrid Protocol</p>
              <p className="text-xs text-gray-400">DSR + Supply APY</p>
            </div>
          </div>
        </div>

        {/* Protocol Metrics */}
        {protocolMetrics && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{protocolMetrics[0]?.toString() || '0'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Loan Duration</p>
              <p className="text-xl font-bold text-gray-900">{protocolMetrics[1]?.toString() || '0'} days</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Default Rate</p>
              <p className="text-xl font-bold text-gray-900">{protocolMetrics[2] ? (Number(protocolMetrics[2]) / 100).toFixed(2) : '0.00'}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-xl font-bold text-gray-900">{protocolMetrics[3] ? (Number(protocolMetrics[3]) / 100).toFixed(2) : '0.00'}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Protocol Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Small Borrower Protection</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Matched from lowest APY first</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Protected from whale impact</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Threshold: &lt; 1,000 USDC</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Whale Borrower Logic</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Matched from highest APY first</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Weighted average APY</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Threshold: ≥ 1,000 USDC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
