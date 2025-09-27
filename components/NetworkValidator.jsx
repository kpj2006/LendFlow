'use client'

import { useNetwork } from 'wagmi'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function NetworkValidator() {
  const { chain } = useNetwork()
  
  const isCorrectNetwork = chain?.id === 31 // Rootstock Testnet
  const isConnected = !!chain

  // Not connected - just show basic message
  if (!isConnected) {
    return null // Don't show anything if wallet not connected
  }

  // Correct network - show success
  if (isCorrectNetwork) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">✅ Connected to Rootstock Testnet</h3>
            <p className="text-sm text-green-700 mt-1">Chain ID: 31 | Currency: tRBTC</p>
          </div>
        </div>
      </div>
    )
  }

  // Wrong network - just show network details
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-red-800 mb-2">⚠️ Wrong Network</h3>
          <p className="text-sm text-red-700 mb-3">
            Connected to: <strong>{chain?.name || 'Unknown'}</strong> (Chain ID: {chain?.id})<br/>
            Required: <strong>Rootstock Testnet</strong>
          </p>
          
          <div className="bg-white border border-red-300 rounded-lg p-3 text-xs">
            <div className="space-y-1 text-red-700">
              <div><strong>Network Name:</strong> Rootstock Testnet</div>
              <div><strong>RPC URL:</strong> https://public-node.testnet.rsk.co</div>
              <div><strong>Chain ID:</strong> 31</div>
              <div><strong>Currency:</strong> tRBTC</div>
              <div><strong>Block Explorer:</strong> https://explorer.testnet.rootstock.io</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}