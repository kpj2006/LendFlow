'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ethers } from 'ethers'
import { toUtf8String, toUtf8Bytes } from 'ethers'
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Bitcoin, 
  Database, 
  Zap,
  Target,
  Shield,
  Activity,
  Coins,
  BarChart3,
  PieChart,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES, USDC_ABI } from '../hooks/useContract'
import { useLendingDataStorage } from '../hooks/useWalrus'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL
const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC

export default function LenderInterface() {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [apy, setApy] = useState('3.8')
  const [useBitcoinCollateral, setUseBitcoinCollateral] = useState(false)
  const [lenderMetadata, setLenderMetadata] = useState('')
  const [walrusMetadata, setWalrusMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Walrus storage hook - must be called before useEffect that uses it
  const { storeLendingData, retrieveLendingData, isLoading: walrusLoading, error: walrusError } = useLendingDataStorage()

  // Get user's USDC balance
  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true
  })

  // Get lender details (enhanced)
  const { data: lenderDetails } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getLenderDetails',
    args: [address],
    watch: true
  })

  // Get stable APY
  const { data: stableAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getStableAPY',
    watch: true
  })

  // Get dynamic APY bounds (stableAPY ± 0.2%)
  const { data: minAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getMinAPY',
    watch: true
  })

  const { data: maxAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getMaxAPY',
    watch: true
  })

  // Contract write for updating stable APY
  const { data: updateAPYData, write: updateStableAPY } = useContractWrite({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'updateStableAPY'
  })

  // Initialize stable APY if it's zero
  useEffect(() => {
    if (stableAPY === 0n && updateStableAPY && address) {
      console.log('Initializing stable APY...')
      updateStableAPY()
    }
  }, [stableAPY, updateStableAPY, address])

  // Load Walrus metadata on component mount
  useEffect(() => {
    const loadWalrusData = async () => {
      if (address) {
        const blobId = localStorage.getItem(`lender_metadata_${address}`)
        if (blobId) {
          const data = await retrieveLendingData(blobId)
          setWalrusMetadata(data)
        }
      }
    }
    loadWalrusData()
  }, [address, retrieveLendingData])

  // Store lender metadata on Walrus when adding liquidity
  const handleAddLiquidity = async () => {
    if (!amount || !apy) return

    setIsLoading(true)
    try {
      // Store metadata on Walrus first
      if (lenderMetadata.trim()) {
        const metadataResult = await storeLendingData({
          type: 'lender_metadata',
          address: address,
          amount: amount,
          apy: apy,
          metadata: lenderMetadata,
          timestamp: Date.now()
        })

        if (metadataResult?.blobId) {
          // Store blobId in localStorage for later retrieval
          localStorage.setItem(`lender_metadata_${address}`, metadataResult.blobId)
          console.log('Metadata stored on Walrus:', metadataResult.blobId)
        }
      }

      // First approve USDC spending
      await approve()
      // Then add liquidity
      await addLiquidity()
    } catch (error) {
      console.error('Error adding liquidity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare approve transaction
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [LENDING_POOL_ADDRESS, parseUnits(amount || '0', 6)],
    enabled: !!amount && parseFloat(amount) > 0
  })

  // Prepare add liquidity transaction with new parameters
  const { config: addLiquidityConfig } = usePrepareContractWrite({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'addLiquidity',
    args: [
      parseUnits(amount || '0', 6),
      Math.floor(parseFloat(apy) * 100),
      useBitcoinCollateral,
      lenderMetadata ? toUtf8Bytes(lenderMetadata) : '0x'
    ],
    enabled: !!amount && parseFloat(amount) > 0,
    value: useBitcoinCollateral ? parseUnits('0.001', 18) : undefined // BTC collateral fee
  })

  const { write: approve } = useContractWrite(approveConfig)
  const { write: addLiquidity } = useContractWrite(addLiquidityConfig)

  const formatAPY = (apyValue) => {
    if (!apyValue) return '0.00%'
    // Convert from ray (1e27) to percentage
    const percentage = (Number(apyValue) / 1e27) * 100
    return `${percentage.toFixed(2)}%`
  }

  const formatBasisPoints = (basisPoints) => {
    if (!basisPoints) return '0.00%'
    // Convert from basis points to percentage
    const percentage = Number(basisPoints) / 100
    return `${percentage.toFixed(2)}%`
  }

  const formatUSDC = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 6)
  }

  const formatBTC = (amount) => {
    if (!amount) return '0.00000000'
    return formatUnits(amount, 8)
  }

  const isInValidRange = apy && minAPY && maxAPY && 
    (parseFloat(apy) * 100 >= Number(minAPY) && parseFloat(apy) * 100 <= Number(maxAPY))

  const hasBalance = usdcBalance && Number(usdcBalance) > 0
  const sufficientBalance = hasBalance && parseFloat(amount || '0') <= parseFloat(formatUSDC(usdcBalance) || '0')

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent flex-1 max-w-32"></div>
          <BarChart3 className="h-8 w-8 text-green-400 mx-4" />
          <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent flex-1 max-w-32"></div>
        </div>
        <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
          LENDER HUB
        </h1>
        <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
          Deploy Capital • Earn Rewards • Build Wealth
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Liquidity Card */}
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-600/20 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-orbitron font-semibold text-green-400 uppercase">
                Capital Deployment
              </h2>
              <p className="text-gray-400 text-sm">Configure liquidity parameters</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-orbitron font-medium text-cyan-400 mb-3 uppercase tracking-wider">
                Deployment Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Enter liquidity amount"
                />
                <Coins className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-400">Available Balance:</span>
                <span className={`font-mono ${hasBalance ? 'text-green-400' : 'text-red-400'}`}>
                  {formatUSDC(usdcBalance)} USDC
                </span>
              </div>
              {!hasBalance && (
                <div className="flex items-center mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>No USDC detected. Acquire tokens to proceed.</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-orbitron font-medium text-cyan-400 mb-3 uppercase tracking-wider">
                Target APY Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={minAPY ? (Number(minAPY) / 100).toFixed(2) : '0'}
                  max={maxAPY ? (Number(maxAPY) / 100).toFixed(2) : '50'}
                  value={apy}
                  onChange={(e) => setApy(e.target.value)}
                  className={`input-field pl-12 ${
                    !isInValidRange && apy ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter target APY"
                />
                <Target className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              
              {/* APY Information Panel */}
              <div className="mt-4 space-y-3">
                <div className="stat-card bg-gray-900/50 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="stat-card-label">Market Reference</span>
                    <span className="stat-card-value text-sm">
                      {stableAPY && stableAPY > 0 ? formatAPY(stableAPY) : 
                       <span className="text-orange-400">⚡ Calibrating...</span>}
                    </span>
                  </div>
                  
                  {stableAPY && stableAPY > 0 && (
                    <div className="text-xs space-y-1 border-t border-gray-700 pt-2">
                      <div className="flex justify-between text-gray-400">
                        <span>📊 70% MakerDAO DSR:</span>
                        <span>5.00%</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>📊 30% Aave v3:</span>
                        <span>3.50%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {minAPY && maxAPY && stableAPY > 0 && (
                  <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-300 flex items-center">
                        <PieChart className="h-4 w-4 mr-1" />
                        Allowed Range:
                      </span>
                      <span className="font-mono text-cyan-400">
                        {formatBasisPoints(minAPY)} - {formatBasisPoints(maxAPY)}
                      </span>
                    </div>
                    <div className="text-xs text-cyan-300/70 mt-1">
                      ±0.2% variance from market reference rate
                    </div>
                  </div>
                )}
                
                {!isInValidRange && apy && minAPY && maxAPY && (
                  <div className="flex items-center p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>APY must be between {formatBasisPoints(minAPY)} and {formatBasisPoints(maxAPY)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Security Options */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <h3 className="text-sm font-orbitron text-cyan-400 uppercase tracking-wider flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security Configuration
              </h3>
              
              <label className="flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBitcoinCollateral}
                  onChange={(e) => setUseBitcoinCollateral(e.target.checked)}
                  className="h-4 w-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Bitcoin className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-orange-400 font-semibold">Bitcoin Collateral Protocol</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">150% over-collateralization • Enhanced security tier</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </label>

              <div>
                <label className="block text-sm font-orbitron text-cyan-400 mb-2 uppercase tracking-wider">
                  <Database className="h-4 w-4 inline mr-1" />
                  Metadata Storage
                </label>
                <textarea
                  value={lenderMetadata}
                  onChange={(e) => setLenderMetadata(e.target.value)}
                  className="input-field"
                  placeholder="Lender preferences, contact details, terms... (encrypted on Walrus Network)"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">🔐 End-to-end encrypted • Stored on decentralized network</p>
              </div>
            </div>

            <button
              onClick={handleAddLiquidity}
              disabled={
                isLoading || !amount || !apy || 
                !isInValidRange || !hasBalance || !sufficientBalance
              }
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Deploying Capital...
                </div>
              ) : !hasBalance ? (
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Acquire USDC Balance
                </div>
              ) : !sufficientBalance ? (
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Insufficient Balance
                </div>
              ) : !isInValidRange ? (
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  APY Out of Range
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Liquidity
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Lender Dashboard */}
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-600/20 rounded-lg mr-4">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-orbitron font-semibold text-blue-400 uppercase">
                Portfolio Analytics
              </h2>
              <p className="text-gray-400 text-sm">Real-time position monitoring</p>
            </div>
          </div>

          {lenderDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <div className="stat-card-label">Total Deposited</div>
                  <div className="stat-card-value">{formatUSDC(lenderDetails[0])}</div>
                  <div className="text-xs text-gray-400 uppercase">USDC</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Available Liquidity</div>
                  <div className="stat-card-value text-green-400">{formatUSDC(lenderDetails[1])}</div>
                  <div className="text-xs text-gray-400 uppercase">Ready to Deploy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Active Loans</div>
                  <div className="stat-card-value text-yellow-400">{formatUSDC(lenderDetails[2])}</div>
                  <div className="text-xs text-gray-400 uppercase">Currently Lent</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Earned Interest</div>
                  <div className="stat-card-value text-cyan-400">{formatUSDC(lenderDetails[3])}</div>
                  <div className="text-xs text-gray-400 uppercase">Total Rewards</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Your APY Rate</span>
                    <span className="badge-primary">
                      {(Number(lenderDetails[4]) / 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Position Status</span>
                    <span className={`badge ${lenderDetails[5] ? 'badge-success' : 'badge-danger'}`}>
                      {lenderDetails[5] ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portfolio Utilization */}
              {lenderDetails[0] > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Capital Utilization</span>
                    <span className="text-cyan-400 font-mono">
                      {((Number(formatUSDC(lenderDetails[2])) / Number(formatUSDC(lenderDetails[0]))) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${((Number(formatUSDC(lenderDetails[2])) / Number(formatUSDC(lenderDetails[0]))) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Walrus Metadata Display */}
              {walrusMetadata && (
                <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                  <h4 className="text-sm font-orbitron text-cyan-400 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Stored Metadata (Walrus Network)
                  </h4>
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-400 max-h-20 overflow-y-auto border border-gray-800">
                    {JSON.stringify(walrusMetadata, null, 2)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative">
                <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <div className="absolute -inset-2 bg-gray-700/20 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-lg font-orbitron text-gray-400 mb-2">No Active Position</h3>
              <p className="text-sm text-gray-500 mb-4">Deploy capital to start earning rewards</p>
              <div className="badge-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                Ready for Deployment
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
