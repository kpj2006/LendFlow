'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { Shield, Zap, TrendingUp, Database, Activity, Terminal } from 'lucide-react'
import LenderInterface from '../components/LenderInterface'
import BorrowerInterface from '../components/BorrowerInterface'
import PoolStatus from '../components/PoolStatus'
import OrderbookVisualizer from '../components/OrderbookVisualizer'
import NetworkValidator from '../components/NetworkValidator'
import { useNetwork } from 'wagmi'

export default function Home() {
  const { isConnected } = useAccount()
  const { chain } = useNetwork()
  const [activeTab, setActiveTab] = useState('pool')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-6"></div>
          <div className="text-xl font-orbitron text-cyan-400 uppercase tracking-wider">
            <span className="text-glow">Initializing Matrix...</span>
          </div>
          <div className="mt-2 text-gray-400">Loading LendFlow Protocol</div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 relative overflow-hidden">
        {/* Hero Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-blue-900/20"></div>
          </div>
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animation: `pulse-neon ${2 + Math.random() * 3}s infinite`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 z-10">
          <div className="text-center mb-12">
            {/* Gaming-style logo */}
            <div className="mb-8 relative">
              <h1 className="text-6xl md:text-8xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-4 text-glow">
                LendFlow
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 blur-xl rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <Terminal className="h-6 w-6 text-cyan-400 mr-2" />
              <span className="text-xl font-orbitron text-cyan-400 uppercase tracking-wider">Protocol v2.0</span>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl font-inter">
              Enter the <span className="text-cyan-400 font-semibold">DeFi Matrix</span> - 
              Next-generation decentralized lending with gamified orderbook matching
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
              <div className="stat-card">
                <Shield className="h-8 w-8 text-cyan-400 mb-3 mx-auto" />
                <div className="stat-card-label">Security Level</div>
                <div className="stat-card-value">Military</div>
              </div>
              <div className="stat-card">
                <Zap className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                <div className="stat-card-label">Network Speed</div>
                <div className="stat-card-value">Lightning</div>
              </div>
              <div className="stat-card">
                <TrendingUp className="h-8 w-8 text-green-400 mb-3 mx-auto" />
                <div className="stat-card-label">APY Rewards</div>
                <div className="stat-card-value">Maximum</div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-2xl mb-12">
            <div className="bg-gradient-to-r from-green-900/50 via-green-800/50 to-green-900/50 border border-green-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-orbitron text-sm uppercase tracking-wider">
                  {chain ? (chain.id === 31 ? 'Rootstock Testnet Active' : `${chain.name} Network`) : 'Network Not Connected'}
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-green-300 text-xs mt-2 font-mono">
                Chain ID: {chain?.id || 'N/A'} | Currency: {chain?.nativeCurrency?.symbol || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur-lg opacity-30"></div>
            <div className="relative">
              <ConnectButton />
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm font-orbitron uppercase tracking-wider">
              Join the Financial Revolution
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'pool', label: 'Command Center', icon: Activity },
    { id: 'lend', label: 'Lender Hub', icon: TrendingUp },
    { id: 'borrow', label: 'Borrower Terminal', icon: Zap },
    { id: 'orderbook', label: 'Order Matrix', icon: Database }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <NetworkValidator />
              <Terminal className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  LendFlow
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400 font-orbitron uppercase tracking-wider">
                    DeFi Protocol v2.0
                  </div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                  {/* <div className="text-xs text-green-400 font-orbitron uppercase tracking-wider">
                    Rootstock Testnet
                  </div> */}
                </div>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-gradient-to-r from-green-900/30 via-green-800/30 to-green-900/30 border border-green-700/50 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-orbitron text-sm uppercase tracking-wider">
              Connected to Rootstock Testnet (Chain ID: 31)
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Gaming-style Navigation */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1"></div>
            <span className="px-6 text-cyan-400 font-orbitron uppercase text-sm tracking-wider">Mission Control</span>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1"></div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2 md:gap-4">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-6 font-medium text-sm transition-all duration-300 rounded-lg ${
                    activeTab === tab.id
                      ? 'tab-active bg-cyan-600/20 border border-cyan-500/50 text-cyan-400'
                      : 'tab-inactive hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content with Gaming Effects */}
        <div className="space-y-8">
          {activeTab === 'pool' && (
            <div className="animate-in fade-in-50 duration-500">
              <PoolStatus />
            </div>
          )}
          {activeTab === 'lend' && (
            <div className="animate-in fade-in-50 duration-500">
              <LenderInterface />
            </div>
          )}
          {activeTab === 'borrow' && (
            <div className="animate-in fade-in-50 duration-500">
              <BorrowerInterface />
            </div>
          )}
          {activeTab === 'orderbook' && (
            <div className="animate-in fade-in-50 duration-500">
              <OrderbookVisualizer />
            </div>
          )}
        </div>
      </main>
      
      {/* Gaming-style footer */}
      <footer className="mt-20 border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1 max-w-32"></div>
              <Terminal className="h-6 w-6 text-cyan-400 mx-4" />
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1 max-w-32"></div>
            </div>
            <p className="text-gray-400 font-orbitron uppercase text-sm tracking-wider">
              LendFlow - Powered by Blockchain Technology
            </p>
            <p className="text-gray-500 text-xs mt-2">
              🛡️ Secured • 🚀 Decentralized • ⚡ Lightning Fast
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
