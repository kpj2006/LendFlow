'use client'

import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { formatUnits } from 'ethers'
import { ArrowUpDown, TrendingUp, TrendingDown, Users, Bitcoin, Database, Zap } from 'lucide-react'
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

  const simulateMatching = () => {
    setIsSimulating(true)
    setSimulationStep(0)
    
    const steps = [
      { step: 1, description: "Small Borrower X requests 30 USDC" },
      { step: 2, description: "System scans lowest APY first (3.6%)" },
      { step: 3, description: "Matches with Lender A (50 USDC @ 3.6%)" },
      { step: 4, description: "Borrower X gets 30 USDC @ 3.6%" },
      { step: 5, description: "Remaining: A=20 USDC, B=50 USDC" },
      { step: 6, description: "Whale Borrower Y requests 70 USDC" },
      { step: 7, description: "System scans highest APY first (4.0%)" },
      { step: 8, description: "Takes 50 USDC from B @ 4.0%" },
      { step: 9, description: "Takes 20 USDC from A @ 3.6%" },
      { step: 10, description: "Weighted APY: (50×4.0 + 20×3.6)/70 ≈ 3.94%" }
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimulationStep(currentStep + 1)
        currentStep++
      } else {
        clearInterval(interval)
        setIsSimulating(false)
      }
    }, 1500)
  }

  const getCurrentStepDescription = () => {
    const steps = [
      "Initial pool state",
      "Small Borrower X requests 30 USDC",
      "System scans lowest APY first (3.6%)",
      "Matches with Lender A (50 USDC @ 3.6%)",
      "Borrower X gets 30 USDC @ 3.6%",
      "Remaining: A=20 USDC, B=50 USDC",
      "Whale Borrower Y requests 70 USDC",
      "System scans highest APY first (4.0%)",
      "Takes 50 USDC from B @ 4.0%",
      "Takes 20 USDC from A @ 3.6%",
      "Weighted APY: (50×4.0 + 20×3.6)/70 ≈ 3.94%"
    ]
    return steps[simulationStep] || "Simulation complete"
  }

  const getCurrentPoolState = () => {
    if (simulationStep <= 4) {
      return [
        { name: 'Lender A', amount: 50, apy: 3.6, available: simulationStep >= 4 ? 20 : 50 },
        { name: 'Lender B', amount: 50, apy: 4.0, available: 50 }
      ]
    } else if (simulationStep <= 9) {
      return [
        { name: 'Lender A', amount: 50, apy: 3.6, available: 20 },
        { name: 'Lender B', amount: 50, apy: 4.0, available: simulationStep >= 8 ? 0 : 50 }
      ]
    } else {
      return [
        { name: 'Lender A', amount: 50, apy: 3.6, available: 0 },
        { name: 'Lender B', amount: 50, apy: 4.0, available: 0 }
      ]
    }
  }

  return (
    <div className="space-y-8">
      {/* Simulation Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Orderbook Matching Simulation</h2>
          <button
            onClick={simulateMatching}
            disabled={isSimulating}
            className="btn-primary disabled:opacity-50"
          >
            {isSimulating ? 'Simulating...' : 'Start Simulation'}
          </button>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            <ArrowUpDown className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Current Step: {simulationStep}/10</span>
          </div>
          <p className="text-blue-800">{getCurrentStepDescription()}</p>
        </div>
      </div>

      {/* Pool State Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lenders */}
        <div className="card">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Lenders</h3>
          </div>

          <div className="space-y-4">
            {getCurrentPoolState().map((lender, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{lender.name}</span>
                  <span className="text-sm text-gray-500">{lender.apy}% APY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available:</span>
                  <span className="font-semibold">{lender.available} USDC</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(lender.available / lender.amount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Borrowers */}
        <div className="card">
          <div className="flex items-center mb-6">
            <TrendingDown className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Borrowers</h3>
          </div>

          <div className="space-y-4">
            {simulationStep >= 1 && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Borrower X (Small)</span>
                  <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {simulationStep >= 4 ? 'Matched' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold">30 USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">APY:</span>
                  <span className="font-semibold">{simulationStep >= 4 ? '3.6%' : 'TBD'}</span>
                </div>
              </div>
            )}

            {simulationStep >= 6 && (
              <div className="p-4 border rounded-lg bg-orange-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Borrower Y (Whale)</span>
                  <span className="text-sm bg-orange-200 text-orange-800 px-2 py-1 rounded">
                    {simulationStep >= 10 ? 'Matched' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold">70 USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">APY:</span>
                  <span className="font-semibold">{simulationStep >= 10 ? '3.94%' : 'TBD'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Integrations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Bitcoin className="h-5 w-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-900">BTC Collateral</h4>
            </div>
            <p className="text-sm text-orange-800">
              Rootstock Protocol enables Bitcoin-backed loans with enhanced security
            </p>
          </div>

          <div className="p-4 bg-cyan-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Database className="h-5 w-5 text-cyan-600 mr-2" />
              <h4 className="font-medium text-cyan-900">Walrus Storage</h4>
            </div>
            <p className="text-sm text-cyan-800">
              Decentralized storage for loan documents and lender metadata
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Zap className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-900">Cross-Chain</h4>
            </div>
            <p className="text-sm text-yellow-800">
              Multi-chain loan execution across Ethereum, Polygon, Arbitrum, and Optimism
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
