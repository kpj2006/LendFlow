'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { GamingButton } from '@/components/ui/GamingButton'
import { User, LogOut, Wallet, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConnectWalletButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConnectWalletButton({ 
  variant = 'primary', 
  size = 'sm',
  className 
}: ConnectWalletButtonProps) {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [isMetaMaskDetected, setIsMetaMaskDetected] = useState(false)

  // Check for MetaMask on component mount
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setIsMetaMaskDetected(true)
      } else {
        setIsMetaMaskDetected(false)
      }
    }

    checkMetaMask()
    
    // Listen for MetaMask installation
    const handleEthereum = () => checkMetaMask()
    window.addEventListener('ethereum#initialized', handleEthereum)
    
    return () => {
      window.removeEventListener('ethereum#initialized', handleEthereum)
    }
  }, [])

  // Show error toast when connection fails
  useEffect(() => {
    if (error) {
      toast.error(`Connection failed: ${error.message}`)
    }
  }, [error])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Mainnet'
      case 11155111: return 'Sepolia'
      default: return 'Unknown'
    }
  }

  const handleConnect = async () => {
    try {
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !window.ethereum) {
        toast.error('MetaMask not detected. Please install MetaMask.')
        if (typeof window !== 'undefined') {
          window.open('https://metamask.io/download/', '_blank')
        }
        return
      }

      // Try to find MetaMask connector first
      let connector = connectors.find(c => c.name.toLowerCase().includes('metamask'))
      
      // Fallback to injected connector
      if (!connector) {
        connector = connectors.find(c => c.id === 'injected')
      }
      
      // Use first available connector as last resort
      if (!connector && connectors.length > 0) {
        connector = connectors[0]
      }

      if (connector) {
        toast.loading('Connecting to wallet...', { id: 'wallet-connect' })
        await connect({ connector })
        toast.success('Wallet connected successfully!', { id: 'wallet-connect' })
      } else {
        toast.error('No wallet connector available')
      }
    } catch (error: any) {
      console.error('Connection failed:', error)
      toast.error(`Failed to connect: ${error?.message || 'Unknown error'}`, { id: 'wallet-connect' })
    }
  }

  const handleDisconnect = () => {
    try {
      disconnect()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded border border-green-500/30 backdrop-blur-sm">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <User className="w-4 h-4 text-green-400" />
          <span className="text-sm font-gaming text-green-400">
            {formatAddress(address)}
          </span>
          <span className="text-xs text-green-400/70">
            {getChainName(chainId)}
          </span>
        </div>
        
        <GamingButton
          variant="secondary"
          size={size}
          onClick={handleDisconnect}
          className={className}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Disconnect</span>
        </GamingButton>
      </div>
    )
  }

  // Connecting state
  if (isConnecting || isPending) {
    return (
      <GamingButton
        variant={variant}
        size={size}
        disabled={true}
        className={className}
      >
        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Connecting...
      </GamingButton>
    )
  }

  // Not connected state
  return (
    <div className="flex items-center gap-2">
      {!isMetaMaskDetected && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-900/20 rounded border border-amber-500/30">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400">Install MetaMask</span>
        </div>
      )}
      
      <GamingButton
        variant={variant}
        size={size}
        onClick={handleConnect}
        className={className}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isMetaMaskDetected ? 'Connect Wallet' : 'Install MetaMask'}
      </GamingButton>
    </div>
  )
}