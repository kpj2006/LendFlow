'use client'

import { useNetwork } from 'wagmi'
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

export default function NetworkValidator() {
  const { chain } = useNetwork()
  const [showTooltip, setShowTooltip] = useState(false)
  
  const isCorrectNetwork = chain?.id === 31 // Rootstock Testnet
  const isConnected = !!chain

  // Not connected - show disconnected icon
  if (!isConnected) {
    return (
      <div className="relative">
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <WifiOff className="h-4 w-4 text-gray-400" />
        </div>
        {showTooltip && (
          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">
            <div className="text-xs text-gray-300">
              <div className="flex items-center mb-2">
                <WifiOff className="h-3 w-3 text-gray-400 mr-2" />
                <span className="text-gray-400">Wallet Not Connected</span>
              </div>
              <div className="text-gray-500">Connect your wallet to view network status</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Correct network - show success icon
  if (isCorrectNetwork) {
    return (
      <div className="relative">
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <CheckCircle className="h-4 w-4 text-green-400" />
        </div>
        {showTooltip && (
          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">
            <div className="text-xs">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                <span className="text-green-400 font-medium">Connected to Rootstock Testnet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Wrong network - show warning icon
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 animate-pulse"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AlertTriangle className="h-4 w-4 text-red-400" />
      </div>
      {showTooltip && (
        <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-red-600 rounded-lg p-3 shadow-lg min-w-64">
          <div className="text-xs">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-3 w-3 text-red-400 mr-2" />
              <span className="text-red-400 font-medium">Wrong Network</span>
            </div>
            <div className="space-y-1 text-gray-300 mb-3">
              <div>Connected: <span className="text-red-300">{chain?.name || 'Unknown'} (ID: {chain?.id})</span></div>
              <div>Required: <span className="text-green-300">Rootstock Testnet (ID: 31)</span></div>
            </div>
            <div className="text-gray-500 text-[10px] border-t border-gray-700 pt-2">
              Switch to Rootstock Testnet in your wallet
            </div>
          </div>
        </div>
      )}
    </div>
  )
}