'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, Clock, Bitcoin, Database, User } from 'lucide-react'

export default function DemoLenderInterface() {
  const [amount, setAmount] = useState('')
  const [apy, setApy] = useState('3.8')
  const [isLoading, setIsLoading] = useState(false)
  const [lenderInfo, setLenderInfo] = useState(null)
  const [useBitcoinCollateral, setUseBitcoinCollateral] = useState(false)
  const [lenderMetadata, setLenderMetadata] = useState('')

  const handleAddLiquidity = async () => {
    if (!amount || !apy) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLenderInfo({
        amount: parseFloat(amount),
        apy: parseFloat(apy),
        timestamp: Date.now(),
        active: true,
        bitcoinCollateral: useBitcoinCollateral,
        metadata: lenderMetadata,
        walrusBlobId: 'demo-lender-blob-id-' + Date.now(),
        stableAPY: 4.2 // Simulated stable APY from MakerDAO/Aave hybrid
      })
      setIsLoading(false)
      setAmount('')
      setLenderMetadata('')
    }, 2000)
  }

  const formatAPY = (apyValue) => {
    return `${apyValue.toFixed(2)}%`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Add Liquidity Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Add Liquidity (Demo)</h2>
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
              Demo Balance: 10,000 USDC
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
              Pyth Reference APY: 3.8% | Stable APY: 4.2%
            </p>
          </div>

          {/* BTC Collateral Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="btcCollateral"
              checked={useBitcoinCollateral}
              onChange={(e) => setUseBitcoinCollateral(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="btcCollateral" className="ml-2 block text-sm text-gray-700">
              <div className="flex items-center">
                <Bitcoin className="h-4 w-4 text-orange-600 mr-1" />
                Use BTC Collateral (Rootstock Protocol)
              </div>
            </label>
          </div>

          {/* Lender Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-purple-600 mr-1" />
                Lender Metadata (Walrus Storage)
              </div>
            </label>
            <textarea
              value={lenderMetadata}
              onChange={(e) => setLenderMetadata(e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Enter lender profile or terms..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Metadata will be stored on Walrus decentralized storage
            </p>
          </div>

          <button
            onClick={handleAddLiquidity}
            disabled={isLoading || !amount || !apy}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Add Liquidity (Demo)'}
          </button>
        </div>
      </div>

      {/* Current Position Card */}
      <div className="card">
        <div className="flex items-center mb-6">
          <DollarSign className="h-6 w-6 text-success-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Your Position</h2>
        </div>

        {lenderInfo ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Lent Amount</span>
              <span className="font-semibold">{lenderInfo.amount} USDC</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Fixed APY</span>
              <span className="font-semibold text-success-600">
                {formatAPY(lenderInfo.apy)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Stable APY</span>
              <span className="font-semibold text-blue-600">
                {formatAPY(lenderInfo.stableAPY)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">BTC Collateral</span>
              <span className="font-semibold flex items-center">
                <Bitcoin className="h-4 w-4 text-orange-600 mr-1" />
                {lenderInfo.bitcoinCollateral ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Since</span>
              <span className="font-semibold">
                {new Date(lenderInfo.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Database className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">Walrus Metadata</span>
              </div>
              <p className="text-sm text-purple-700 font-mono">
                Blob ID: {lenderInfo.walrusBlobId}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Lender profile stored on decentralized storage
              </p>
            </div>

            <div className="pt-4 border-t">
              <button className="btn-secondary w-full">
                Withdraw Liquidity
              </button>
            </div>
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
