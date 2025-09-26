'use client'

import { useState } from 'react'
import { TrendingDown, DollarSign, AlertCircle, Bitcoin, FileText, Zap, Database } from 'lucide-react'

export default function DemoBorrowerInterface() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [borrowerInfo, setBorrowerInfo] = useState(null)
  const [requireBTCCollateral, setRequireBTCCollateral] = useState(false)
  const [loanDocument, setLoanDocument] = useState('')
  const [targetChain, setTargetChain] = useState('ethereum')

  const handleRequestLoan = async () => {
    if (!amount) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const isWhale = parseFloat(amount) >= 1000
      const weightedAPY = isWhale ? 3.94 : 3.6

      setBorrowerInfo({
        amount: parseFloat(amount),
        weightedAPY: weightedAPY,
        timestamp: Date.now(),
        active: true,
        type: isWhale ? 'whale' : 'small',
        btcCollateral: requireBTCCollateral,
        loanDocument: loanDocument,
        targetChain: targetChain,
        repaymentAmount: parseFloat(amount) * (1 + weightedAPY / 100),
        walrusBlobId: 'demo-blob-id-' + Date.now()
      })
      setIsLoading(false)
      setAmount('')
      setLoanDocument('')
    }, 2000)
  }

  const handleRepayLoan = async () => {
    setIsLoading(true)
    
    setTimeout(() => {
      setBorrowerInfo(null)
      setIsLoading(false)
    }, 1000)
  }

  const formatAPY = (apyValue) => {
    return `${apyValue.toFixed(2)}%`
  }

  const isWhaleBorrower = parseFloat(amount) >= 1000
  const availableLiquidity = 100000 // Demo value

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Request Loan Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <TrendingDown className="h-6 w-6 text-warning-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Request Loan (Demo)</h2>
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
              Available Pool Liquidity: {availableLiquidity.toLocaleString()} USDC
            </p>
          </div>

          {/* BTC Collateral Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="btcCollateral"
              checked={requireBTCCollateral}
              onChange={(e) => setRequireBTCCollateral(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="btcCollateral" className="ml-2 block text-sm text-gray-700">
              <div className="flex items-center">
                <Bitcoin className="h-4 w-4 text-orange-600 mr-1" />
                Require BTC Collateral (Rootstock Protocol)
              </div>
            </label>
          </div>

          {/* Loan Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-blue-600 mr-1" />
                Loan Document (Walrus Storage)
              </div>
            </label>
            <textarea
              value={loanDocument}
              onChange={(e) => setLoanDocument(e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Enter loan purpose or document details..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Document will be stored on Walrus decentralized storage
            </p>
          </div>

          {/* Target Chain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-yellow-600 mr-1" />
                Target Chain
              </div>
            </label>
            <select
              value={targetChain}
              onChange={(e) => setTargetChain(e.target.value)}
              className="input-field"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
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

          <button
            onClick={handleRequestLoan}
            disabled={isLoading || !amount || parseFloat(amount) > availableLiquidity}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Request Loan (Demo)'}
          </button>
        </div>
      </div>

      {/* Current Loan Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <DollarSign className="h-6 w-6 text-danger-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Your Loan</h2>
        </div>

        {borrowerInfo ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Borrowed Amount</span>
              <span className="font-semibold">{borrowerInfo.amount} USDC</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Weighted APY</span>
              <span className="font-semibold text-danger-600">
                {formatAPY(borrowerInfo.weightedAPY)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Repayment Amount</span>
              <span className="font-semibold text-danger-600">
                {borrowerInfo.repaymentAmount.toFixed(2)} USDC
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Borrower Type</span>
              <span className="font-semibold capitalize">{borrowerInfo.type}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">BTC Collateral Required</span>
              <span className="font-semibold flex items-center">
                <Bitcoin className="h-4 w-4 text-orange-600 mr-1" />
                {borrowerInfo.btcCollateral ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Target Chain</span>
              <span className="font-semibold capitalize flex items-center">
                <Zap className="h-4 w-4 text-yellow-600 mr-1" />
                {borrowerInfo.targetChain}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Borrowed Since</span>
              <span className="font-semibold">
                {new Date(borrowerInfo.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Database className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Walrus Document</span>
              </div>
              <p className="text-sm text-blue-700 font-mono">
                Blob ID: {borrowerInfo.walrusBlobId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Document stored on decentralized storage
              </p>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleRepayLoan}
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Repay Loan (Demo)'}
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
