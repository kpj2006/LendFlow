'use client'

import { useNetwork, useSwitchNetwork } from 'wagmi'
import { AlertTriangle, CheckCircle, ExternalLink, Plus } from 'lucide-react'
import { addRootstockTestnet, switchToRootstockTestnet } from '../utils/network-utils'
import { useState } from 'react'

const REQUIRED_NETWORK = {
  id: 31,
  name: 'Rootstock Testnet',
  rpcUrl: 'https://public-node.testnet.rsk.co',
  chainId: 31,
  symbol: 'tRBTC',
  blockExplorer: 'https://explorer.testnet.rootstock.io'
}

export default function NetworkValidator() {
  const { chain } = useNetwork()
  const { switchNetwork, isLoading: isSwitching } = useSwitchNetwork()
  const [isAddingNetwork, setIsAddingNetwork] = useState(false)

  const isCorrectNetwork = chain?.id === REQUIRED_NETWORK.id
  const isConnected = !!chain

  const handleAddNetwork = async () => {
    setIsAddingNetwork(true)
    try {
      await addRootstockTestnet()
    } catch (error) {
      console.error('Failed to add network:', error)
      alert('Failed to add Rootstock Testnet. Please add it manually.')
    } finally {
      setIsAddingNetwork(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Connect Wallet</h3>
            <p className="text-sm text-blue-700 mt-1">
              Please connect your wallet to continue
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isCorrectNetwork) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">✅ Connected to {REQUIRED_NETWORK.name}</h3>
              <p className="text-sm text-green-700 mt-1">
                Chain ID: {REQUIRED_NETWORK.chainId} | Currency: {REQUIRED_NETWORK.symbol}
              </p>
            </div>
          </div>
          <a
            href={REQUIRED_NETWORK.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-red-600 mr-4 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-2">⚠️ Wrong Network Detected</h3>
          <p className="text-sm text-red-700 mb-4">
            You're currently connected to <strong>{chain?.name || 'Unknown Network'}</strong> (Chain ID: {chain?.id}). 
            This dapp only works on Rootstock Testnet.
          </p>
          
          <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-800 mb-3">🔧 Required Network Configuration:</h4>
            <div className="space-y-2 text-sm text-red-700">
              <div className="flex justify-between">
                <span className="font-medium">Network Name:</span>
                <span className="font-mono">{REQUIRED_NETWORK.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Default RPC URL:</span>
                <span className="font-mono text-xs">public-node.testnet.rsk.co</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Chain ID:</span>
                <span className="font-mono">{REQUIRED_NETWORK.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Currency Symbol:</span>
                <span className="font-mono">{REQUIRED_NETWORK.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Block Explorer URL:</span>
                <span className="font-mono text-xs">explorer.testnet.rootstock.io</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddNetwork}
              disabled={isAddingNetwork}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingNetwork ? 'Adding Network...' : 'Add Rootstock Testnet'}
            </button>
            
            {switchNetwork && (
              <button
                onClick={() => switchNetwork(REQUIRED_NETWORK.id)}
                disabled={isSwitching}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSwitching ? 'Switching...' : `Switch Network`}
              </button>
            )}
            
            <a
              href="https://dev.rootstock.io/wallet/use/metamask/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-center flex items-center justify-center"
            >
              Manual Guide
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}