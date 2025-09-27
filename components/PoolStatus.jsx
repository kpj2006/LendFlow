'use client'

import { useContractRead } from 'wagmi'
import { formatUnits } from 'ethers'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Bitcoin, 
  Database, 
  Zap,
  Shield,
  Target,
  BarChart3,
  Gauge,
  Trophy,
  Cpu,
  Globe,
  Lock
} from 'lucide-react'
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

  const formatNumber = (num) => {
    if (!num) return '0'
    const number = Number(num)
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M'
    if (number >= 1000) return (number / 1000).toFixed(1) + 'K'
    return number.toString()
  }

  const stats = [
    {
      name: 'Available Liquidity',
      value: poolStatus ? formatUSDC(poolStatus[0]) : '0.00',
      unit: 'USDC',
      icon: DollarSign,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/20',
      description: 'Ready for deployment'
    },
    {
      name: 'Active Loans',
      value: poolStatus ? formatUSDC(poolStatus[1]) : '0.00',
      unit: 'USDC',
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-600/20',
      description: 'Currently deployed'
    },
    {
      name: 'Lender Network',
      value: poolStatus ? formatNumber(poolStatus[2]) : '0',
      unit: 'Nodes',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
      description: 'Capital providers'
    },
    {
      name: 'Active Borrowers',
      value: poolStatus ? formatNumber(poolStatus[3]) : '0',
      unit: 'Users',
      icon: Target,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/20',
      description: 'Credit utilizers'
    },
    {
      name: 'Average APY',
      value: poolStatus ? (Number(poolStatus[4]) / 100).toFixed(2) + '%' : '0.00%',
      unit: '',
      icon: TrendingUp,
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
      description: 'Weighted interest rate'
    },
    {
      name: 'Total Rewards',
      value: poolStatus ? formatUSDC(poolStatus[5]) : '0.00',
      unit: 'USDC',
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20',
      description: 'Interest generated'
    }
  ]

  const protocolStats = [
    {
      name: 'BTC Collateral Vault',
      value: poolStatus ? formatBTC(poolStatus[6]) : '0.00000000',
      unit: 'BTC',
      icon: Bitcoin,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/20',
      description: 'Secured collateral'
    },
    {
      name: 'Walrus Storage Pool',
      value: poolStatus ? formatUSDC(poolStatus[7]) : '0.00',
      unit: 'WAL',
      icon: Database,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      description: 'Decentralized rewards'
    },
    {
      name: 'Cross-Chain Operations',
      value: poolStatus ? formatNumber(poolStatus[8]) : '0',
      unit: 'Txns',
      icon: Globe,
      color: 'text-pink-400',
      bgColor: 'bg-pink-600/20',
      description: 'Multi-chain loans'
    }
  ]

  const utilization = poolStatus && poolStatus[0] && poolStatus[1] ? 
    (Number(formatUSDC(poolStatus[1])) / (Number(formatUSDC(poolStatus[0])) + Number(formatUSDC(poolStatus[1])))) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-32"></div>
          <Cpu className="h-8 w-8 text-blue-400 mx-4" />
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-32"></div>
        </div>
        <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          COMMAND CENTER
        </h1>
        <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
          Protocol Status • Network Analytics • System Health
        </p>
      </div>

      {/* Main Pool Overview */}
      <div className="card-glow">
        <div className="flex items-center mb-8">
          <div className="p-3 bg-blue-600/20 rounded-lg mr-4">
            <BarChart3 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-blue-400 uppercase">Core Metrics</h2>
            <p className="text-gray-400 text-sm">Real-time protocol statistics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="stat-card group hover:scale-105 transition-transform duration-300">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${stat.bgColor} mb-4 group-hover:pulse-neon`}>
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="stat-card-value text-3xl mb-2">
                  {stat.value}
                  {stat.unit && <span className="text-lg text-gray-400 ml-2">{stat.unit}</span>}
                </div>
                <div className="stat-card-label mb-1">{stat.name}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            )
          })}
        </div>

        {/* Utilization Progress Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-orbitron text-cyan-400 uppercase tracking-wider flex items-center">
              <Gauge className="h-4 w-4 mr-2" />
              Capital Utilization Rate
            </span>
            <span className="text-cyan-400 font-mono text-lg">{utilization.toFixed(1)}%</span>
          </div>
          <div className="progress-bar h-4">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Protocol Enhancements */}
      <div className="card-glow">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-purple-600/20 rounded-lg mr-4">
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-orbitron font-bold text-purple-400 uppercase">Advanced Features</h3>
            <p className="text-gray-400 text-sm">Enhanced security and cross-chain capabilities</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {protocolStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="stat-card group hover:scale-105 transition-transform duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-4 group-hover:pulse-neon`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="stat-card-value text-2xl mb-2">
                  {stat.value}
                  {stat.unit && <span className="text-lg text-gray-400 ml-1">{stat.unit}</span>}
                </div>
                <div className="stat-card-label mb-1">{stat.name}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            )
          })}
        </div>

        {/* Stable APY Display - Gaming Style */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl p-6 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-orbitron text-cyan-400 uppercase tracking-wider mb-2">Market Reference Rate</h4>
              <p className="text-4xl font-orbitron font-bold text-cyan-400 text-glow">{formatAPY(stableAPY)}</p>
              <p className="text-gray-400 text-xs mt-1">Hybrid Protocol: MakerDAO DSR + Aave v3</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between min-w-[120px]">
                  <span>📊 DSR (70%):</span>
                  <span className="text-green-400">5.00%</span>
                </div>
                <div className="flex justify-between">
                  <span>📊 Aave (30%):</span>
                  <span className="text-blue-400">3.50%</span>
                </div>
                <hr className="border-gray-700 my-2"/>
                <div className="flex justify-between font-medium">
                  <span>⚡ Weighted:</span>
                  <span className="text-cyan-400">{formatAPY(stableAPY)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocol Metrics Dashboard */}
        {protocolMetrics && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card text-center">
              <div className="stat-card-value text-xl">{protocolMetrics[0]?.toString() || '0'}</div>
              <div className="stat-card-label">Total Transactions</div>
            </div>
            <div className="stat-card text-center">
              <div className="stat-card-value text-xl">{protocolMetrics[1]?.toString() || '0'}</div>
              <div className="stat-card-label">Avg Loan Duration (Days)</div>
            </div>
            <div className="stat-card text-center">
              <div className="stat-card-value text-xl text-green-400">
                {protocolMetrics[2] ? (Number(protocolMetrics[2]) / 100).toFixed(2) : '0.00'}%
              </div>
              <div className="stat-card-label">Default Rate</div>
            </div>
            <div className="stat-card text-center">
              <div className="stat-card-value text-xl text-blue-400">
                {protocolMetrics[3] ? (Number(protocolMetrics[3]) / 100).toFixed(2) : '0.00'}%
              </div>
              <div className="stat-card-label">Pool Utilization</div>
            </div>
          </div>
        )}
      </div>

      {/* Protocol Features - Gaming Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-600/20 rounded-lg mr-4">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-orbitron font-bold text-green-400 uppercase">Small Borrower Protocol</h3>
              <p className="text-gray-400 text-xs">Protection algorithms active</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-900/20 rounded-lg border border-green-500/20">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-green-300">🎯 Lowest APY matching priority</span>
            </div>
            <div className="flex items-center p-3 bg-green-900/20 rounded-lg border border-green-500/20">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-green-300">🛡️ Whale impact protection enabled</span>
            </div>
            <div className="flex items-center p-3 bg-green-900/20 rounded-lg border border-green-500/20">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-green-300">📏 Threshold: &lt; 1,000 USDC</span>
            </div>
          </div>
        </div>

        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-orange-600/20 rounded-lg mr-4">
              <Trophy className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-orbitron font-bold text-orange-400 uppercase">Whale Borrower Protocol</h3>
              <p className="text-gray-400 text-xs">Premium features unlocked</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-orange-300">🚀 Highest APY matching priority</span>
            </div>
            <div className="flex items-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-orange-300">⚖️ Dynamic weighted APY calculation</span>
            </div>
            <div className="flex items-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-orange-300">🐋 Threshold: ≥ 1,000 USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-400 font-orbitron uppercase">System Online</span>
          </div>
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-cyan-400 mr-2" />
            <span className="text-gray-400 font-orbitron uppercase">Secured</span>
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-gray-400 font-orbitron uppercase">High Performance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
