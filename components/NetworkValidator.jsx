'use client'

import { useNetwork } from 'wagmi'
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

export default function NetworkValidator() {
  const { chain } = useNetwork()
  const [showTooltip, setShowTooltip] = useState(false)

  // Supported networks - allow multiple networks for flexibility
  const supportedNetworks = {
    31: { name: 'Rootstock Testnet', color: 'blue', optimal: true },
  }

  const isConnected = !!chain
  const currentNetwork = chain?.id ? supportedNetworks[chain.id] : null
  const isSupported = !!currentNetwork

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

  // Supported network - show success with network info
  if (isSupported) {
    const colorClass = currentNetwork.optimal 
      ? 'text-green-400 bg-green-500/20 border-green-500/50'
      : 'text-blue-400 bg-blue-500/20 border-blue-500/50'
    
    return (
      <div className="relative">
        <div 
          className={`flex items-center justify-center w-8 h-8 rounded-full border ${colorClass}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <CheckCircle className={`h-4 w-4 ${currentNetwork.optimal ? 'text-green-400' : 'text-blue-400'}`} />
        </div>
        {showTooltip && (
          <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">
            <div className="text-xs">
              <div className="flex items-center mb-2">
                <CheckCircle className={`h-3 w-3 mr-2 ${currentNetwork.optimal ? 'text-green-400' : 'text-blue-400'}`} />
                <span className={`font-medium ${currentNetwork.optimal ? 'text-green-400' : 'text-blue-400'}`}>
                  Connected to {currentNetwork.name}
                </span>
              </div>
              <div className="text-gray-300 text-[10px]">
                Chain ID: {chain.id} {currentNetwork.optimal && '(Recommended)'}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Unsupported network - show warning
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AlertTriangle className="h-4 w-4 text-orange-400" />
      </div>
      {showTooltip && (
        <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-orange-600 rounded-lg p-3 shadow-lg min-w-64">
          <div className="text-xs">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-3 w-3 text-orange-400 mr-2" />
              <span className="text-orange-400 font-medium">Unsupported Network</span>
            </div>
            <div className="space-y-1 text-gray-300 mb-3">
              <div>Connected: <span className="text-orange-300">{chain?.name || 'Unknown'} (ID: {chain?.id})</span></div>
            </div>
            <div className="text-gray-500 text-[10px] border-t border-gray-700 pt-2">
              Switch to a supported network for full functionality
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
