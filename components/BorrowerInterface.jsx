'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ethers } from 'ethers'
import { toUtf8String, toUtf8Bytes } from 'ethers'
import { 
  Zap, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Bitcoin, 
  Database, 
  Target,
  TrendingDown,
  Shield,
  Timer,
  Coins,
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES, USDC_ABI, CETH_ABI } from '../hooks/useContract'
import { useLendingDataStorage } from '../hooks/useWalrus'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL
const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC
const CETH_ADDRESS = CONTRACT_ADDRESSES.CETH

export default function BorrowerInterface() {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [requireBTCCollateral, setRequireBTCCollateral] = useState(false)
  const [loanDocument, setLoanDocument] = useState('')
  const [targetChain, setTargetChain] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get user's USDC balance
  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true
  })

  // Get user's cETH balance for collateral
  const { data: cethBalance } = useContractRead({
    address: CETH_ADDRESS,
    abi: CETH_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true
  })

  // Get pool status (enhanced)
  const { data: poolStatus } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStatus',
    watch: true
  })

  // Get borrower details (enhanced)
  const { data: borrowerDetails } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getBorrowerDetails',
    args: [address],
    watch: true
  })

  // cETH Faucet for testing
  const { config: cethFaucetConfig, error: cethFaucetError } = usePrepareContractWrite({
    address: CETH_ADDRESS,
    abi: CETH_ABI,
    functionName: 'faucet',
    enabled: !!address
  })
  
  // Debug cETH faucet config
  useEffect(() => {
    console.log('cETH Faucet Debug:', {
      address: CETH_ADDRESS,
      userAddress: address,
      config: !!cethFaucetConfig,
      error: cethFaucetError?.message
    })
  }, [address, cethFaucetConfig, cethFaucetError])
  
  const { write: getCETH, isLoading: isFaucetLoading, error: cethWriteError } = useContractWrite(cethFaucetConfig)
  
  // Manual cETH faucet handler if wagmi fails
  const handleGetCETH = async () => {
    console.log('Attempting to get cETH...')
    if (getCETH) {
      console.log('Using wagmi getCETH function')
      try {
        await getCETH()
      } catch (error) {
        console.error('Wagmi cETH faucet error:', error)
      }
    } else {
      console.error('getCETH function not available:', {
        config: !!cethFaucetConfig,
        configError: cethFaucetError?.message,
        writeError: cethWriteError?.message
      })
    }
  }

  // Use off-chain Walrus storage for loan documents
  const { storeLendingData, retrieveLendingData, isStoring, isRetrieving } = useLendingDataStorage()
  const [loanDocumentBlobId, setLoanDocumentBlobId] = useState(null)
  const [storedLoanDocument, setStoredLoanDocument] = useState(null)

  // Load stored loan document on component mount
  useEffect(() => {
    const loadStoredDocument = async () => {
      if (address) {
        const blobId = localStorage.getItem(`loanDocument_${address}`)
        if (blobId) {
          setLoanDocumentBlobId(blobId)
          try {
            const document = await retrieveLendingData(blobId)
            setStoredLoanDocument(document)
          } catch (error) {
            console.error('Error retrieving loan document:', error)
          }
        }
      }
    }
    loadStoredDocument()
  }, [address, retrieveLendingData])

  // Get stable APY for reference
  const { data: stableAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getStableAPY',
    watch: true
  })

  // Prepare request loan transaction with new parameters
  const { config: requestLoanConfig } = usePrepareContractWrite({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'requestLoan',
    args: [
      parseUnits(amount || '0', 6),
      requireBTCCollateral,
      targetChain
    ],
    enabled: !!amount && parseFloat(amount) > 0,
    value: requireBTCCollateral ? parseUnits('0.001', 18) : undefined // BTC collateral fee
  })

  const { write: requestLoan } = useContractWrite(requestLoanConfig)

  // Prepare repay loan transaction
  const { config: repayLoanConfig } = usePrepareContractWrite({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'repayLoan',
    enabled: borrowerDetails && borrowerDetails[4] // active status
  })

  const { write: repayLoan } = useContractWrite(repayLoanConfig)

  const handleRequestLoan = async () => {
    if (!amount) return
    
    setIsLoading(true)
    try {
      // Store loan document off-chain if provided
      let blobId = null
      if (loanDocument.trim()) {
        blobId = await storeLendingData({
          type: 'loanDocument',
          borrower: address,
          amount: amount,
          document: loanDocument,
          timestamp: Date.now()
        })
        // Store blob ID in localStorage for later retrieval
        localStorage.setItem(`loanDocument_${address}`, blobId)
        setLoanDocumentBlobId(blobId)
      }
      
      await requestLoan()
    } catch (error) {
      console.error('Error requesting loan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepayLoan = async () => {
    setIsLoading(true)
    try {
      await repayLoan()
    } catch (error) {
      console.error('Error repaying loan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatUSDC = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 6)
  }

  const formatCETH = (amount) => {
    if (!amount) return '0.00'
    return formatUnits(amount, 18) // cETH uses 18 decimals like ETH
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

  const isWhaleBorrower = parseFloat(amount) >= 1000
  const availableLiquidity = poolStatus ? formatUSDC(poolStatus[0]) : '0.00'

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-red-400 to-transparent flex-1 max-w-32"></div>
          <Target className="h-8 w-8 text-red-400 mx-4" />
          <div className="h-px bg-gradient-to-r from-transparent via-red-400 to-transparent flex-1 max-w-32"></div>
        </div>
        <h1 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-2">
          BORROWER TERMINAL
        </h1>
        <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
          Access Credit • Deploy Capital • Maximize Returns
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Loan Card */}
        <div className="card-glow">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-600/20 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-orbitron font-semibold text-red-400 uppercase">
                Credit Request
              </h2>
              <p className="text-gray-400 text-sm">Initialize loan parameters</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-orbitron font-medium text-cyan-400 mb-3 uppercase tracking-wider">
                Target Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Enter loan amount"
                />
                <DollarSign className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-400">Available Pool Liquidity:</span>
                <span className="font-mono text-cyan-400">{availableLiquidity} USDC</span>
              </div>
            </div>

            {amount && (
              <div className={`p-4 rounded-lg border ${
                isWhaleBorrower 
                  ? 'bg-purple-900/20 border-purple-500/30' 
                  : 'bg-blue-900/20 border-blue-500/30'
              }`}>
                <div className="flex items-center mb-2">
                  <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="badge-primary">
                    {isWhaleBorrower ? '🐋 Whale Protocol' : '🔷 Standard Protocol'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {isWhaleBorrower 
                    ? '⚡ Priority matching with highest APY lenders • Premium features unlocked'
                    : '🎯 Optimized matching with lowest APY lenders • Cost-efficient borrowing'
                  }
                </p>
              </div>
            )}

            {/* Advanced Options */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <h3 className="text-sm font-orbitron text-cyan-400 uppercase tracking-wider flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security Configuration
              </h3>
              
              <div className="space-y-4">
                {/* BTC Collateral Option */}
                <label className="flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireBTCCollateral}
                    onChange={(e) => setRequireBTCCollateral(e.target.checked)}
                    className="h-4 w-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Bitcoin className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-orange-400 font-semibold">Enhanced BTC Collateral</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">150% collateral ratio • Military-grade security</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </label>

                {/* Target Chain */}
                <div>
                  <label className="block text-sm font-orbitron text-cyan-400 mb-2 uppercase tracking-wider">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Deployment Chain
                  </label>
                  <select
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Same Chain (USDC)</option>
                    <option value="bitcoin">Cross-Chain Bitcoin (via Rootstock)</option>
                  </select>
                </div>

                {/* Loan Document */}
                <div>
                  <label className="block text-sm font-orbitron text-cyan-400 mb-2 uppercase tracking-wider">
                    <Database className="h-4 w-4 inline mr-1" />
                    Decentralized Documentation
                  </label>
                  <textarea
                    value={loanDocument}
                    onChange={(e) => setLoanDocument(e.target.value)}
                    className="input-field"
                    placeholder="Loan terms, purpose, metadata... (stored on Walrus Network)"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">📡 Encrypted & stored on Walrus decentralized storage</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRequestLoan}
              disabled={isLoading || !amount || parseFloat(amount) > parseFloat(availableLiquidity)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Executing Transaction...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  Initialize Loan Request
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Loan Status Section */}
        <div className="space-y-6">
          {/* Current Loan Card */}
          <div className="card-glow">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-600/20 rounded-lg mr-4">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-orbitron font-semibold text-green-400 uppercase">
                  Active Position
                </h2>
                <p className="text-gray-400 text-sm">Current loan status</p>
              </div>
            </div>

            {borrowerDetails && borrowerDetails[4] ? ( // active status
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-card">
                    <div className="stat-card-label">Borrowed Amount</div>
                    <div className="stat-card-value">{formatUSDC(borrowerDetails[0])}</div>
                    <div className="text-xs text-gray-400 uppercase">USDC</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Weighted APY</div>
                    <div className="stat-card-value text-red-400">{formatAPY(borrowerDetails[1])}</div>
                    <div className="text-xs text-gray-400 uppercase">Interest Rate</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Maturity Date</div>
                    <div className="stat-card-value text-sm">{new Date(Number(borrowerDetails[3]) * 1000).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400 uppercase">Due Date</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Total Repayment</div>
                    <div className="stat-card-value text-yellow-400">{formatUSDC(borrowerDetails[6])}</div>
                    <div className="text-xs text-gray-400 uppercase">USDC</div>
                  </div>
                </div>

                <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Cross-Chain
                      </span>
                      <span className={`badge ${borrowerDetails[5] ? 'badge-success' : 'badge-primary'}`}>
                        {borrowerDetails[5] ? 'Active' : 'Same Chain'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="badge-success">
                        {borrowerDetails[4] ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Walrus Document Display */}
                {storedLoanDocument && (
                  <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                    <h4 className="text-sm font-orbitron text-cyan-400 mb-2 flex items-center">
                      <Database className="h-4 w-4 mr-1" />
                      Stored Documentation (Walrus Network)
                    </h4>
                    <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-400 max-h-20 overflow-y-auto border border-gray-800">
                      {storedLoanDocument ? JSON.stringify(storedLoanDocument, null, 2) : 'No document found'}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleRepayLoan}
                  className="btn-success w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner h-4 w-4 mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Coins className="h-4 w-4 mr-2" />
                      Execute Loan Repayment
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Timer className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="absolute -inset-2 bg-gray-700/20 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-lg font-orbitron text-gray-400 mb-2">No Active Position</h3>
                <p className="text-sm text-gray-500 mb-4">Initialize a loan request to get started</p>
                <div className="badge-primary">
                  🚀 Ready to Deploy Capital
                </div>
              </div>
            )}
          </div>

          {/* Test Collateral Card - Gaming Style */}
          <div className="card bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-orange-500/30">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg mr-3">
                <Bitcoin className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-orbitron font-semibold text-orange-400">🧪 Faucet (for tester only)</h3>
              </div>
            </div>

            <div className="space-y-4">
              {/* <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
                <p className="text-orange-200 text-sm mb-2">
                  🎯 Acquire test cETH tokens for collateral testing
                </p>
                <div className="text-xs text-orange-300/70">
                  🎉 No cooldown! Mint as many times as needed for testing
                </div>
              </div> */}
              
              <div className="stat-card bg-orange-900/10">
                <div className="stat-card-label text-orange-400">Current Balance</div>
                <div className="stat-card-value text-orange-300">{formatCETH(cethBalance)}</div>
                <div className="text-xs text-orange-400 uppercase">cETH Tokens</div>
              </div>
              
              <button
                onClick={handleGetCETH}
                disabled={isFaucetLoading}
                className="btn-secondary w-full disabled:opacity-50"
              >
                {isFaucetLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner h-4 w-4 mr-2"></div>
                    Deploying cETH...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Bitcoin className="h-4 w-4 mr-2" />
                    Deploy 1,000 Test cETH
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
