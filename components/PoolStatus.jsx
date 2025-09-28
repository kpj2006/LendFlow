'use client'

import { useContractRead } from 'wagmi'
import { formatUnits } from 'ethers'
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Bitcoin, 
  Database,
  Shield,
  Target,
  Gauge,
  Trophy,
  Cpu,
  Globe,
  Terminal
} from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES } from '../hooks/useContract'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL

export default function PoolStatus() {
  // Contract reads
  const { data: poolStatus } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStatus',
    watch: true
  })

  const { data: stableAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getStableAPY',
    watch: true
  })

  // Helper functions
  const formatUSDC = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 6)
  }

  const formatAPY = (apyValue) => {
    if (!apyValue) return '0.00%'
    const percentage = (Number(apyValue) / 1e27) * 100
    return `${percentage.toFixed(2)}%`
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    const number = Number(num)
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M'
    if (number >= 1000) return (number / 1000).toFixed(1) + 'K'
    return number.toString()
  }

  const utilization = poolStatus && poolStatus[0] && poolStatus[1] ? 
    (Number(formatUSDC(poolStatus[1])) / (Number(formatUSDC(poolStatus[0])) + Number(formatUSDC(poolStatus[1])))) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-purple-900/20 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-full border-2 border-cyan-400/50">
                  <Cpu className="h-12 w-12 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-orbitron font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              COMMAND CENTER
            </h1>
            
            <div className="flex items-center justify-center space-x-6 text-sm font-orbitron uppercase tracking-wider">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-400">Protocol Active</span>
              </div>
              <div className="h-4 w-px bg-gray-600"></div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-blue-400">Network Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Protocol Features Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1 max-w-32"></div>
          <Shield className="h-8 w-8 text-cyan-400 mx-4" />
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1 max-w-32"></div>
        </div>
        <h2 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
          PROTOCOL FEATURES
        </h2>
        <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
          Advanced Lending & Borrowing Protocols
        </p>
      </div>
      {/* Lender and Borrower Protocol Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lender Protocol */}
        <div className="group relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-blue-900/10 backdrop-blur-sm rounded-3xl border border-blue-400/30 p-8">
            
            {/* Lender Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-xl border border-blue-400/50">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-orbitron font-bold text-blue-400">LENDER HUB</h3>
                  <p className="text-blue-300/60 text-sm font-orbitron">Capital deployment features</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-900/20 border border-blue-500/30 rounded-full">
                <span className="text-blue-400 text-xs font-orbitron font-bold">ACTIVE</span>
              </div>
            </div>
            
            {/* Lender Features */}
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-500/20 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full mr-4">
                  <DollarSign className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 font-orbitron text-sm font-bold">Flexible Capital Deployment</div>
                  <div className="text-blue-200/60 text-xs">Deploy USDC with custom APY rates</div>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-500/20 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full mr-4">
                  <Gauge className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 font-orbitron text-sm font-bold">Dynamic APY Setting</div>
                  <div className="text-blue-200/60 text-xs">Set competitive interest rates</div>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-500/20 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full mr-4">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 font-orbitron text-sm font-bold">Risk Management</div>
                  <div className="text-blue-200/60 text-xs">Advanced collateral protection</div>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-500/20 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full mr-4">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 font-orbitron text-sm font-bold">Real-time Monitoring</div>
                  <div className="text-blue-200/60 text-xs">Track lending performance</div>
                </div>
              </div>
            </div>

            {/* Lender Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
                <div className="text-2xl font-orbitron font-bold text-blue-400">
                  {poolStatus ? formatUSDC(poolStatus[0]) : '0.00'}
                </div>
                <div className="text-xs text-blue-300/70 font-orbitron">Available Liquidity</div>
              </div>
              <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
                <div className="text-2xl font-orbitron font-bold text-blue-400">
                  {poolStatus ? formatNumber(poolStatus[2]) : '0'}
                </div>
                <div className="text-xs text-blue-300/70 font-orbitron">Active Lenders</div>
              </div>
            </div>
          </div>
        </div>
        {/* Borrower Protocol */}
        <div className="space-y-6">
          {/* Small Borrower Protocol */}
          <div className="group relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-green-900/10 backdrop-blur-sm rounded-3xl border border-green-400/30 p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur-md opacity-50"></div>
                    <div className="relative p-3 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-lg border border-green-400/50">
                      <Shield className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-orbitron font-bold text-green-400">SMALL BORROWER</h3>
                    <p className="text-green-300/60 text-xs font-orbitron">Protection algorithms</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-900/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-xs font-orbitron font-bold">ACTIVE</span>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg border border-green-500/20">
                  <Target className="h-3 w-3 text-green-400 mr-3" />
                  <span className="text-green-300 font-orbitron text-xs">Lowest APY matching priority</span>
                </div>
                
                <div className="flex items-center p-3 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg border border-green-500/20">
                  <Shield className="h-3 w-3 text-green-400 mr-3" />
                  <span className="text-green-300 font-orbitron text-xs">Whale impact protection</span>
                </div>
                
                <div className="flex items-center p-3 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg border border-green-500/20">
                  <DollarSign className="h-3 w-3 text-green-400 mr-3" />
                  <span className="text-green-300 font-orbitron text-xs">Threshold: &lt; 1,000 USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Whale Borrower Protocol */}
          <div className="group relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-orange-900/10 backdrop-blur-sm rounded-3xl border border-orange-400/30 p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg blur-md opacity-50"></div>
                    <div className="relative p-3 bg-gradient-to-r from-orange-600/30 to-yellow-600/30 rounded-lg border border-orange-400/50">
                      <Trophy className="h-6 w-6 text-orange-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-orbitron font-bold text-orange-400">WHALE BORROWER</h3>
                    <p className="text-orange-300/60 text-xs font-orbitron">Premium features</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-orange-900/20 border border-orange-500/30 rounded-full">
                  <span className="text-orange-400 text-xs font-orbitron font-bold">PREMIUM</span>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gradient-to-r from-orange-900/20 to-orange-800/20 rounded-lg border border-orange-500/20">
                  <TrendingUp className="h-3 w-3 text-orange-400 mr-3" />
                  <span className="text-orange-300 font-orbitron text-xs">Highest APY matching priority</span>
                </div>
                
                <div className="flex items-center p-3 bg-gradient-to-r from-orange-900/20 to-orange-800/20 rounded-lg border border-orange-500/20">
                  <Gauge className="h-3 w-3 text-orange-400 mr-3" />
                  <span className="text-orange-300 font-orbitron text-xs">Dynamic weighted APY calculation</span>
                </div>
                
                <div className="flex items-center p-3 bg-gradient-to-r from-orange-900/20 to-orange-800/20 rounded-lg border border-orange-500/20">
                  <Bitcoin className="h-3 w-3 text-orange-400 mr-3" />
                  <span className="text-orange-300 font-orbitron text-xs">Threshold: ≥ 1,000 USDC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Market Reference Rate */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-orbitron text-cyan-400 uppercase tracking-wider mb-2">Market Reference Rate</h4>
            <p className="text-4xl font-orbitron font-bold text-cyan-400">{formatAPY(stableAPY)}</p>
            <p className="text-gray-400 text-sm mt-1">Hybrid Protocol: MakerDAO DSR + Aave v3</p>
          </div>
          <div className="text-right">
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between min-w-[120px]">
                <span>DSR (70%):</span>
                <span className="text-green-400">5.00%</span>
              </div>
              <div className="flex justify-between">
                <span>Aave (30%):</span>
                <span className="text-blue-400">3.50%</span>
              </div>
              <div className="h-px bg-gray-600 my-2"></div>
              <div className="flex justify-between font-medium">
                <span>Weighted:</span>
                <span className="text-cyan-400">{formatAPY(stableAPY)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Utilization */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-600/20 rounded-lg mr-3">
              <Gauge className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-orbitron font-bold text-cyan-400">CAPITAL UTILIZATION</h3>
              <p className="text-gray-400 text-sm">Liquidity deployment efficiency</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-orbitron font-bold text-cyan-400 mb-1">
              {utilization.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Current Rate</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-3 font-orbitron">
            <span>Safe: 0-60%</span>
            <span>Optimal: 60-85%</span>
            <span>High: 85-100%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative">
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800/50 rounded-full border border-gray-600/50">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-400 font-mono text-sm">cyberlend@protocol:~$</span>
              <span className="text-gray-400 font-mono text-sm">status --all</span>
              <div className="w-2 h-4 bg-cyan-400 animate-pulse ml-1"></div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-orbitron">
              CyberLend Protocol v2.0  Powered by Advanced DeFi Technology
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
