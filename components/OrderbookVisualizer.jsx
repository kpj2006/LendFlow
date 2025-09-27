'use client'

import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { formatUnits } from 'ethers'
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Bitcoin, 
  Database, 
  Zap,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Target,
  Cpu,
  Brain,
  ChevronRight,
  GitBranch
} from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES } from '../hooks/useContract'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL

// Mock data for demonstration
const mockLenders = [
  { address: '0x1234...', amount: 50000, apy: 360, active: true },
  { address: '0x5678...', amount: 30000, apy: 380, active: true },
  { address: '0x9abc...', amount: 20000, apy: 400, active: true },
]

const mockBorrowers = [
  { address: '0xdef0...', amount: 30000, type: 'small', status: 'matched' },
  { address: '0x1234...', amount: 70000, type: 'whale', status: 'matched' },
]

export default function OrderbookVisualizer() {
  const [simulationStep, setSimulationStep] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Get pool status
  const { data: poolStatus } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStatus',
    watch: true
  })

  const formatUSDC = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 6)
  }

  const formatAPY = (apyValue) => {
    if (!apyValue) return '0.00%'
    return `${(Number(apyValue) / 100).toFixed(2)}%`
  }

  const resetSimulation = () => {
    setIsSimulating(false)
    setIsPaused(false)
    setSimulationStep(0)
  }

  const simulateMatching = () => {
    if (isPaused) {
      setIsPaused(false)
      setIsSimulating(true)
      return
    }

    setIsSimulating(true)
    setSimulationStep(0)
    setIsPaused(false)
    
    const steps = [
      { step: 1, description: "🔍 Small Borrower X requests 30 USDC" },
      { step: 2, description: "⚡ AI Engine scans lowest APY first (3.6%)" },
      { step: 3, description: "🎯 Smart matching with Lender A (50 USDC @ 3.6%)" },
      { step: 4, description: "✅ Borrower X secured 30 USDC @ 3.6%" },
      { step: 5, description: "📊 Pool updated: A=20 USDC, B=50 USDC" },
      { step: 6, description: "🐋 Whale Borrower Y requests 70 USDC" },
      { step: 7, description: "🚀 System prioritizes highest APY first (4.0%)" },
      { step: 8, description: "⚡ Acquiring 50 USDC from Lender B @ 4.0%" },
      { step: 9, description: "🔄 Acquiring remaining 20 USDC from A @ 3.6%" },
      { step: 10, description: "🧮 Calculating weighted APY: (50×4.0 + 20×3.6)/70 ≈ 3.94%" }
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (!isPaused) {
        if (currentStep < steps.length) {
          setSimulationStep(currentStep + 1)
          currentStep++
        } else {
          clearInterval(interval)
          setIsSimulating(false)
        }
      }
    }, 2000)
  }

  const pauseSimulation = () => {
    setIsPaused(true)
    setIsSimulating(false)
  }

  const getCurrentStepDescription = () => {
    const steps = [
      "🔧 Initial pool state - Liquidity ready for deployment",
      "🔍 Small Borrower X requests 30 USDC",
      "⚡ AI Engine scans lowest APY first (3.6%)",
      "🎯 Smart matching with Lender A (50 USDC @ 3.6%)",
      "✅ Borrower X secured 30 USDC @ 3.6%",
      "📊 Pool updated: A=20 USDC, B=50 USDC remaining",
      "🐋 Whale Borrower Y requests 70 USDC",
      "🚀 System prioritizes highest APY first (4.0%)",
      "⚡ Acquiring 50 USDC from Lender B @ 4.0%",
      "🔄 Acquiring remaining 20 USDC from A @ 3.6%",
      "🧮 Final weighted APY: (50×4.0 + 20×3.6)/70 ≈ 3.94%"
    ]
    return steps[simulationStep] || "🏁 Simulation complete - All orders matched"
  }

  const getCurrentPoolState = () => {
    if (simulationStep <= 4) {
      return [
        { name: 'Lender Alpha', amount: 50, apy: 3.6, available: simulationStep >= 4 ? 20 : 50, status: simulationStep >= 3 ? 'active' : 'idle' },
        { name: 'Lender Beta', amount: 50, apy: 4.0, available: 50, status: 'idle' }
      ]
    } else if (simulationStep <= 9) {
      return [
        { name: 'Lender Alpha', amount: 50, apy: 3.6, available: simulationStep >= 9 ? 0 : 20, status: simulationStep >= 9 ? 'active' : 'partial' },
        { name: 'Lender Beta', amount: 50, apy: 4.0, available: simulationStep >= 8 ? 0 : 50, status: simulationStep >= 8 ? 'active' : 'idle' }
      ]
    } else {
      return [
        { name: 'Lender Alpha', amount: 50, apy: 3.6, available: 0, status: 'complete' },
        { name: 'Lender Beta', amount: 50, apy: 4.0, available: 0, status: 'complete' }
      ]
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'border-gray-600 bg-gray-800/50'
      case 'partial': return 'border-yellow-500/50 bg-yellow-900/20'
      case 'active': return 'border-green-500/50 bg-green-900/20'
      case 'complete': return 'border-cyan-500/50 bg-cyan-900/20'
      default: return 'border-gray-600 bg-gray-800/50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1 max-w-32"></div>
          <Brain className="h-8 w-8 text-purple-400 mx-4" />
          <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1 max-w-32"></div>
        </div>
        <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          ORDER MATRIX
        </h1>
        <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
          AI-Powered Matching • Real-Time Simulation • Smart Algorithms
        </p>
      </div>

      {/* Simulation Controls */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600/20 rounded-lg mr-4">
              <Cpu className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-orbitron font-bold text-purple-400 uppercase">Smart Matching Engine</h2>
              <p className="text-gray-400 text-sm">Advanced orderbook simulation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={simulateMatching}
              disabled={isSimulating}
              className="btn-primary disabled:opacity-50"
            >
              <div className="flex items-center">
                {isSimulating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isSimulating ? 'Running...' : isPaused ? 'Resume' : 'Start Simulation'}
              </div>
            </button>
            
            {(isSimulating || simulationStep > 0) && (
              <>
                <button
                  onClick={pauseSimulation}
                  disabled={!isSimulating}
                  className="btn-secondary disabled:opacity-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="btn-secondary"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 mb-6">
          <div className="flex items-center mb-3">
            <Activity className="h-5 w-5 text-purple-400 mr-3" />
            <span className="font-orbitron font-medium text-purple-300 uppercase tracking-wider">
              Execution Phase: {simulationStep}/10
            </span>
            <div className="flex-1 mx-4">
              <div className="progress-bar h-2">
                <div 
                  className="progress-fill"
                  style={{ width: `${(simulationStep / 10) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-purple-400 font-mono text-sm">{Math.round((simulationStep / 10) * 100)}%</span>
          </div>
          <p className="text-purple-200 text-lg font-medium">{getCurrentStepDescription()}</p>
        </div>
      </div>

      {/* Pool State Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lenders Matrix */}
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-600/20 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-orbitron font-semibold text-green-400 uppercase">Capital Providers</h3>
              <p className="text-gray-400 text-sm">Liquidity pool matrix</p>
            </div>
          </div>

          <div className="space-y-4">
            {getCurrentPoolState().map((lender, index) => {
              const utilizationPercent = ((lender.amount - lender.available) / lender.amount) * 100
              return (
                <div key={index} className={`p-4 rounded-lg border-2 transition-all duration-1000 ${getStatusColor(lender.status)}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        lender.status === 'idle' ? 'bg-gray-400' :
                        lender.status === 'partial' ? 'bg-yellow-400 animate-pulse' :
                        lender.status === 'active' ? 'bg-green-400 animate-pulse' :
                        'bg-cyan-400'
                      }`}></div>
                      <span className="font-orbitron font-medium text-gray-200">{lender.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">APY Rate</div>
                      <div className="text-lg font-mono text-cyan-400">{lender.apy}%</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Available</div>
                      <div className="text-lg font-mono text-green-400">{lender.available} USDC</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Total Pool</div>
                      <div className="text-lg font-mono text-gray-300">{lender.amount} USDC</div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Utilization</span>
                      <span>{utilizationPercent.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          lender.status === 'complete' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'progress-fill'
                        }`}
                        style={{ width: `${utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`badge ${
                      lender.status === 'idle' ? 'badge-primary' :
                      lender.status === 'partial' ? 'badge-warning' :
                      lender.status === 'active' ? 'badge-success' :
                      'text-cyan-400'
                    }`}>
                      {lender.status.toUpperCase()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Borrowers Matrix */}
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-600/20 rounded-lg mr-4">
              <Target className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-orbitron font-semibold text-red-400 uppercase">Credit Seekers</h3>
              <p className="text-gray-400 text-sm">Active loan requests</p>
            </div>
          </div>

          <div className="space-y-4">
            {simulationStep >= 1 && (
              <div className="p-4 border-2 rounded-lg bg-blue-900/20 border-blue-500/50 transition-all duration-1000">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                    <span className="font-orbitron font-medium text-blue-300">Borrower X</span>
                    <span className="badge-primary ml-2">Small</span>
                  </div>
                  <span className={`badge ${simulationStep >= 4 ? 'badge-success' : 'badge-warning'}`}>
                    {simulationStep >= 4 ? '✅ Matched' : '⏳ Processing'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Amount</div>
                    <div className="text-lg font-mono text-blue-400">30 USDC</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Final APY</div>
                    <div className="text-lg font-mono text-green-400">
                      {simulationStep >= 4 ? '3.6%' : 'Calculating...'}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  🎯 Strategy: Lowest APY Priority • Cost Optimization
                </div>
                
                {simulationStep >= 4 && (
                  <div className="flex items-center text-xs text-green-300">
                    <GitBranch className="h-3 w-3 mr-1" />
                    <span>Matched with Lender Alpha @ 3.6% APY</span>
                  </div>
                )}
              </div>
            )}

            {simulationStep >= 6 && (
              <div className="p-4 border-2 rounded-lg bg-orange-900/20 border-orange-500/50 transition-all duration-1000">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
                    <span className="font-orbitron font-medium text-orange-300">Borrower Y</span>
                    <span className="badge-warning ml-2">🐋 Whale</span>
                  </div>
                  <span className={`badge ${simulationStep >= 10 ? 'badge-success' : 'badge-warning'}`}>
                    {simulationStep >= 10 ? '✅ Matched' : '⚡ Processing'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Amount</div>
                    <div className="text-lg font-mono text-orange-400">70 USDC</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Weighted APY</div>
                    <div className="text-lg font-mono text-yellow-400">
                      {simulationStep >= 10 ? '3.94%' : 'Computing...'}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  🚀 Strategy: Highest APY Priority • Premium Matching
                </div>
                
                {simulationStep >= 10 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-orange-300">
                      <GitBranch className="h-3 w-3 mr-1" />
                      <span>50 USDC from Lender Beta @ 4.0% APY</span>
                    </div>
                    <div className="flex items-center text-xs text-orange-300">
                      <GitBranch className="h-3 w-3 mr-1" />
                      <span>20 USDC from Lender Alpha @ 3.6% APY</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {simulationStep === 0 && (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="absolute -inset-2 bg-gray-700/20 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-lg font-orbitron text-gray-400 mb-2">Awaiting Orders</h3>
                <p className="text-sm text-gray-500 mb-4">AI matching engine ready for deployment</p>
                <div className="badge-primary">
                  🧠 Neural Network Standby
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Integrations - Gaming Style */}
      <div className="card-glow">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-cyan-600/20 rounded-lg mr-4">
            <Database className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-orbitron font-bold text-cyan-400 uppercase">Protocol Integrations</h3>
            <p className="text-gray-400 text-sm">Multi-chain infrastructure stack</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card bg-orange-900/20 border border-orange-500/30 hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg mr-3">
                <Bitcoin className="h-6 w-6 text-orange-400" />
              </div>
              <h4 className="font-orbitron font-medium text-orange-300 uppercase">BTC Collateral</h4>
            </div>
            <p className="text-sm text-orange-200 mb-3">
              🔗 Rootstock Protocol enables Bitcoin-backed loans with military-grade security
            </p>
            <div className="badge-warning">
              150% Collateral Ratio
            </div>
          </div>

          <div className="stat-card bg-purple-900/20 border border-purple-500/30 hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg mr-3">
                <Database className="h-6 w-6 text-purple-400" />
              </div>
              <h4 className="font-orbitron font-medium text-purple-300 uppercase">Walrus Storage</h4>
            </div>
            <p className="text-sm text-purple-200 mb-3">
              🔐 Decentralized storage for loan documents and metadata with end-to-end encryption
            </p>
            <div className="badge-primary">
              Zero-Trust Architecture
            </div>
          </div>

          <div className="stat-card bg-yellow-900/20 border border-yellow-500/30 hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-600/20 rounded-lg mr-3">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <h4 className="font-orbitron font-medium text-yellow-300 uppercase">Cross-Chain</h4>
            </div>
            <p className="text-sm text-yellow-200 mb-3">
              ⚡ Multi-chain execution across Ethereum, Polygon, Arbitrum, and Optimism networks
            </p>
            <div className="badge-success">
              4+ Networks Active
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
