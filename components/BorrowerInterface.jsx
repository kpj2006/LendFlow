'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ethers } from 'ethers'
import { toUtf8String, toUtf8Bytes } from 'ethers'
import { TrendingDown, DollarSign, AlertCircle, FileText, Bitcoin, Database, Zap } from 'lucide-react'
import { LENDING_POOL_ABI, CONTRACT_ADDRESSES, USDC_ABI } from '../hooks/useContract'

const LENDING_POOL_ADDRESS = CONTRACT_ADDRESSES.LENDING_POOL
const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC

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

  // Get loan document from Walrus
  const { data: loanDocumentData } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'retrieveLoanDocument',
    args: [address],
    watch: true,
    enabled: borrowerDetails?.[5] && borrowerDetails[5] !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  })

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
      loanDocument ? toUtf8Bytes(loanDocument) : '0x',
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Request Loan Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <TrendingDown className="h-6 w-6 text-warning-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Request Loan</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="Enter loan amount"
            />
            <p className="text-sm text-gray-500 mt-1">
              Available Pool Liquidity: {availableLiquidity} USDC
            </p>
          </div>

          {amount && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {isWhaleBorrower ? 'Whale Borrower' : 'Small Borrower'}
                </span>
              </div>
              <p className="text-sm text-blue-700">
                {isWhaleBorrower 
                  ? 'You will be matched with highest APY lenders first'
                  : 'You will be matched with lowest APY lenders first'
                }
              </p>
            </div>
          )}

          {/* BTC Collateral Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="btcCollateral"
              checked={requireBTCCollateral}
              onChange={(e) => setRequireBTCCollateral(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="btcCollateral" className="ml-2 block text-sm text-gray-700 flex items-center">
              <Bitcoin className="h-4 w-4 mr-1" />
              Require BTC Collateral (150% ratio for enhanced security)
            </label>
          </div>

          {/* Loan Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Loan Document (stored on Walrus)
            </label>
            <textarea
              value={loanDocument}
              onChange={(e) => setLoanDocument(e.target.value)}
              className="input-field"
              placeholder="Optional: Add loan terms, purpose, etc. (stored decentralized)"
              rows={3}
            />
          </div>

          {/* Cross-chain Option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              Target Chain (optional)
            </label>
            <select
              value={targetChain}
              onChange={(e) => setTargetChain(e.target.value)}
              className="input-field"
            >
              <option value="">Same Chain (USDC)</option>
              <option value="bitcoin">Bitcoin (via Rootstock)</option>
            </select>
          </div>

          <button
            onClick={handleRequestLoan}
            disabled={isLoading || !amount || parseFloat(amount) > parseFloat(availableLiquidity)}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Request Loan'}
          </button>
        </div>
      </div>

      {/* Current Loan Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <DollarSign className="h-6 w-6 text-danger-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Your Loan</h2>
        </div>

        {borrowerDetails && borrowerDetails[4] ? ( // active status
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Borrowed Amount</p>
                <p className="text-lg font-semibold">{formatUSDC(borrowerDetails[0])} USDC</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Weighted APY</p>
                <p className="text-lg font-semibold text-red-600">{formatAPY(borrowerDetails[1])}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-lg font-semibold">{new Date(Number(borrowerDetails[3]) * 1000).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Repayment Amount</p>
                <p className="text-lg font-semibold">{formatUSDC(borrowerDetails[8])} USDC</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Bitcoin className="h-4 w-4 mr-1" />
                  BTC Collateral Ratio
                </span>
                <span className="text-sm font-medium">{borrowerDetails[6] ? `${Number(borrowerDetails[6]) / 100}%` : 'None'}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Zap className="h-4 w-4 mr-1" />
                  Cross-Chain Loan
                </span>
                <span className="text-sm font-medium">{borrowerDetails[7] ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${borrowerDetails[4] ? 'text-green-600' : 'text-red-600'}`}>
                  {borrowerDetails[4] ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Walrus Loan Document Display */}
            {loanDocumentData && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Stored Loan Document (Walrus)
                </h3>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
                  {loanDocumentData ? toUtf8String(loanDocumentData) : 'No document stored'}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={handleRepayLoan}
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Repay Loan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active loan</p>
            <p className="text-sm text-gray-400 mt-2">
              Request a loan to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
