'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ethers } from 'ethers'
import { toUtf8String, toUtf8Bytes } from 'ethers'
import { TrendingUp, DollarSign, Clock, Bitcoin, Database, Zap } from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES, USDC_ABI } from '../hooks/useContract'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL
const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC

export default function LenderInterface() {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [apy, setApy] = useState('3.8')
  const [useBitcoinCollateral, setUseBitcoinCollateral] = useState(false)
  const [lenderMetadata, setLenderMetadata] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get user's USDC balance
  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true
  })

  // Get stable APY (MakerDAO + Aave hybrid)
  const { data: stableAPY } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'getStableAPY',
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

  // Get lender data from Walrus
  const { data: lenderWalrusData } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'retrieveLenderData',
    args: [address],
    watch: true,
    enabled: lenderDetails?.[9] && lenderDetails[9] !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  })

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

  const handleAddLiquidity = async () => {
    if (!amount || !apy) return
    
    setIsLoading(true)
    try {
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

  const formatAPY = (apyValue) => {
    if (!apyValue) return '0.00%'
    // Convert from ray (1e27) to percentage
    const percentage = (Number(apyValue) / 1e27) * 100
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Add Liquidity Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Add Liquidity</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="Enter amount"
            />
            <p className="text-sm text-gray-500 mt-1">
              Balance: {formatUSDC(usdcBalance)} USDC
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fixed APY (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={apy}
              onChange={(e) => setApy(e.target.value)}
              className="input-field"
              placeholder="Enter APY"
            />
            <p className="text-sm text-gray-500 mt-1">
              Stable APY Reference: {formatAPY(stableAPY)}
            </p>
          </div>

          {/* Bitcoin Collateral Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="btcCollateral"
              checked={useBitcoinCollateral}
              onChange={(e) => setUseBitcoinCollateral(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="btcCollateral" className="ml-2 block text-sm text-gray-700 flex items-center">
              <Bitcoin className="h-4 w-4 mr-1" />
              Use Bitcoin Collateral (150% ratio required)
            </label>
          </div>

          {/* Lender Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Database className="h-4 w-4 mr-1" />
              Lender Metadata (stored on Walrus)
            </label>
            <textarea
              value={lenderMetadata}
              onChange={(e) => setLenderMetadata(e.target.value)}
              className="input-field"
              placeholder="Optional: Add lender preferences, contact info, etc. (stored decentralized)"
              rows={3}
            />
          </div>

          <button
            onClick={handleAddLiquidity}
            disabled={isLoading || !amount || !apy}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Add Liquidity'}
          </button>
        </div>
      </div>

      {/* Lender Dashboard */}
      <div className="card">
        <div className="flex items-center mb-6">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Your Lending Position</h2>
        </div>

        {lenderDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Deposited</p>
                <p className="text-lg font-semibold">{formatUSDC(lenderDetails[0])} USDC</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Available Amount</p>
                <p className="text-lg font-semibold">{formatUSDC(lenderDetails[1])} USDC</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Lent Amount</p>
                <p className="text-lg font-semibold">{formatUSDC(lenderDetails[2])} USDC</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Earned Interest</p>
                <p className="text-lg font-semibold">{formatUSDC(lenderDetails[3])} USDC</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Your APY</span>
                <span className="text-sm font-medium">{(Number(lenderDetails[4]) / 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Bitcoin className="h-4 w-4 mr-1" />
                  BTC Collateral
                </span>
                <span className="text-sm font-medium">{formatBTC(lenderDetails[7])} BTC</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Walrus Rewards
                </span>
                <span className="text-sm font-medium">{formatUSDC(lenderDetails[6])} WAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${lenderDetails[5] ? 'text-green-600' : 'text-red-600'}`}>
                  {lenderDetails[5] ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Walrus Data Display */}
            {lenderWalrusData && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Stored Metadata (Walrus)
                </h3>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
                  {lenderWalrusData ? toUtf8String(lenderWalrusData) : 'No metadata stored'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active lending position</p>
            <p className="text-sm text-gray-400 mt-2">
              Add liquidity to start earning
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
