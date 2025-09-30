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
  const [walrusStatus, setWalrusStatus] = useState(null) // 'storing', 'success', 'error'
  const [generatedBlobId, setGeneratedBlobId] = useState(null)
  const [walrusMessage, setWalrusMessage] = useState('')

  // Walrus storage hook - must be called before useEffect that uses it
  const { storeLendingData, retrieveLendingData, isLoading: walrusLoading, error: walrusError } = useLendingDataStorage()

  // Get user's USDC balance
  const { data: usdcBalance, error: usdcBalanceError, isLoading: usdcBalanceLoading } = useContractRead({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    enabled: !!address
  })

  // Debug USDC balance
  useEffect(() => {
    console.log('USDC Balance Debug:', {
      address: address,
      usdcAddress: USDC_ADDRESS,
      balance: usdcBalance?.toString(),
      error: usdcBalanceError?.message,
      isLoading: usdcBalanceLoading
    })
  }, [address, usdcBalance, usdcBalanceError, usdcBalanceLoading])

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

  // Contract interactions removed - Demo mode with Walrus storage only

  // Initialize stable APY if it's zero
  useEffect(() => {
    if (stableAPY === 0n && updateStableAPY && address) {
      console.log('Initializing stable APY...')
      updateStableAPY()
    }
  }, [stableAPY, updateStableAPY, address])

  // Demo mode - Contract interactions removed for stability

  // Load Walrus metadata on component mount
  useEffect(() => {
    const loadWalrusData = async () => {
      if (address) {
        const blobId = localStorage.getItem(`lender_metadata_${address}`)
        if (blobId) {
          try {
            const data = await retrieveLendingData(blobId)
            if (data) {
              setWalrusMetadata(data)
            }
          } catch (error) {
            console.error('Error loading Walrus metadata:', error)
          }
        }
      }
    }
    loadWalrusData()
  }, [address]) // Remove retrieveLendingData from dependencies to prevent infinite loop

  // Store lender metadata on Walrus (Demo Mode - No Contract Interaction)
  const handleAddLiquidity = async () => {
    if (!amount || !apy) return

    setIsLoading(true)
    setWalrusStatus(null)
    setWalrusMessage('')
    setGeneratedBlobId(null)

    try {
      // Store metadata on Walrus
      if (lenderMetadata.trim()) {
        setWalrusStatus('storing')
        setWalrusMessage('🔄 Storing metadata on Walrus Network...')

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
          setGeneratedBlobId(metadataResult.blobId)
          setWalrusStatus('success')
          setWalrusMessage(`✅ Metadata stored successfully! Blob ID: ${metadataResult.blobId}`)
          console.log('✅ Metadata stored on Walrus with Blob ID:', metadataResult.blobId)
        } else {
          console.error('❌ Walrus storage failed - no blob ID returned:', metadataResult)
          throw new Error('Failed to generate blob ID')
        }
      } else {
        // If no metadata, just show success for demo
        setWalrusStatus('success')
        setWalrusMessage(`✅ Liquidity operation completed! Amount: ${amount} USDC at ${apy}% APY`)
        console.log('✅ Demo liquidity operation completed')
      }

      // Clear form after success
      setAmount('')
      setLenderMetadata('')
    } catch (error) {
      console.error('Error in liquidity operation:', error)
      setWalrusStatus('error')
      setWalrusMessage(`❌ Error: ${error.message || 'Operation failed'}`)
    } finally {
      setIsLoading(false)
    }
  }

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

  const isInValidRange = apy && (parseFloat(apy) >= 3.6 && parseFloat(apy) <= 4.0)

  const hasBalance = usdcBalance && Number(usdcBalance) > 0
  const sufficientBalance = hasBalance && parseFloat(amount || '0') <= parseFloat(formatUSDC(usdcBalance) || '0')

  return (
    <div key={address} className="space-y-8">
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
                <div className="flex items-center space-x-2">
                  <span className={`font-mono ${hasBalance ? 'text-green-400' : 'text-red-400'}`}>
                    {usdcBalanceLoading ? 'Loading...' : formatUSDC(usdcBalance)} USDC
                  </span>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                    title="Refresh balance"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {!hasBalance && (
                <div className="flex items-center mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>No USDC detected at {USDC_ADDRESS}. Check your network and token import.</span>
                </div>
              )}
              {usdcBalanceError && (
                <div className="flex items-center mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Contract read error: {usdcBalanceError.message}</span>
                </div>
              )}
              
              {!hasBalance && address && (
                <div className="mt-3 p-3 bg-gray-800/50 border border-gray-600/30 rounded">
                  <div className="text-xs text-gray-300 mb-2">Need USDC tokens?</div>
                  <button
                    onClick={async () => {
                      try {
                        await window.ethereum.request({
                          method: 'wallet_watchAsset',
                          params: {
                            type: 'ERC20',
                            options: {
                              address: USDC_ADDRESS,
                              symbol: 'USDC',
                              decimals: 6,
                            },
                          },
                        })
                      } catch (error) {
                        console.error('Error adding token:', error)
                      }
                    }}
                    className="w-full text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded px-3 py-2 transition-colors"
                  >
                    Add USDC Token to MetaMask
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    Contract: {USDC_ADDRESS}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-orbitron font-medium text-cyan-400 mb-3 uppercase tracking-wider">
                Target APY Rate (%)
              </label>
              <div className="relative">
                {/* APY Display */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-cyan-400 mr-2" />
                    <span className="text-lg font-mono text-cyan-400">{parseFloat(apy).toFixed(2)}%</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Range: 3.60% - 4.00%
                  </div>
                </div>
                
                {/* Gaming-style Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="3.6"
                    max="4.0"
                    step="0.01"
                    value={apy}
                    onChange={(e) => setApy(e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((parseFloat(apy) - 3.6) / 0.4) * 100}%, #374151 ${((parseFloat(apy) - 3.6) / 0.4) * 100}%, #374151 100%)`
                    }}
                  />
                  
                  {/* Slider Labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>3.60%</span>
                    <span className="text-cyan-400">3.80%</span>
                    <span>4.00%</span>
                  </div>
                  
                  {/* Slider Markers */}
                  <div className="absolute top-0 left-0 w-full h-2 flex justify-between items-center pointer-events-none">
                    <div className="w-0.5 h-4 bg-gray-600 -mt-1"></div>
                    <div className="w-0.5 h-4 bg-cyan-400 -mt-1"></div>
                    <div className="w-0.5 h-4 bg-gray-600 -mt-1"></div>
                  </div>
                </div>
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
                
                <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cyan-300 flex items-center">
                      <PieChart className="h-4 w-4 mr-1" />
                      Target APY Range:
                    </span>
                    <span className="font-mono text-cyan-400">
                      3.6% - 4.0%
                    </span>
                  </div>
                  <div className="text-xs text-cyan-300/70 mt-1">
                    3.8% ±0.2% fixed range optimized for stability
                  </div>
                </div>
                
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
                
                {/* Walrus Status Display */}
                {walrusStatus && (
                  <div className={`mt-3 p-3 rounded-lg border text-sm ${
                    walrusStatus === 'storing' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' :
                    walrusStatus === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                    'bg-red-900/20 border-red-500/30 text-red-400'
                  }`}>
                    <div className="font-medium">{walrusMessage}</div>
                    {generatedBlobId && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Blob ID:</span>
                        <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-cyan-400">
                          {generatedBlobId.slice(0, 8)}...{generatedBlobId.slice(-8)}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedBlobId)
                            alert('Blob ID copied to clipboard!')
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 ml-2"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Info when no metadata */}
                {!lenderMetadata.trim() && !walrusStatus && (
                  <div className="mt-3 p-3 rounded-lg border border-gray-600/30 bg-gray-800/30 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      <span>Optional: Add metadata to store on Walrus Network</span>
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      Leave empty to skip metadata storage and proceed directly to lending
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAddLiquidity}
              disabled={isLoading || !amount || !apy}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-4 w-4 mr-2"></div>
                  {walrusStatus === 'storing' ? 'Storing Metadata on Walrus...' : 'Processing Demo...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Database className="h-4 w-4 mr-2" />
                  Demo Liquidity + Walrus Storage
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
              {(walrusMetadata || generatedBlobId) && (
                <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                  <h4 className="text-sm font-orbitron text-cyan-400 mb-3 flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Walrus Network Storage
                  </h4>
                  
                  {/* Current Session Blob ID */}
                  {generatedBlobId && (
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 text-sm font-medium">✅ Latest Upload</span>
                        <span className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-cyan-400">
                          {generatedBlobId}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedBlobId)
                            alert('Full Blob ID copied to clipboard!')
                          }}
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded text-white transition-colors"
                        >
                          Copy Full ID
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Previous Stored Metadata */}
                  {walrusMetadata && (
                    <div>
                      <span className="text-gray-400 text-sm mb-2 block">📦 Stored Metadata:</span>
                      <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-400 max-h-20 overflow-y-auto border border-gray-800">
                        {JSON.stringify(walrusMetadata, null, 2)}
                      </div>
                    </div>
                  )}

                  {/* Stored Blob ID from localStorage */}
                  {address && localStorage.getItem(`lender_metadata_${address}`) && (
                    <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs">
                      <span className="text-blue-400">🔗 Previous Blob ID: </span>
                      <code className="text-cyan-400 font-mono">
                        {localStorage.getItem(`lender_metadata_${address}`)}
                      </code>
                    </div>
                  )}
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
