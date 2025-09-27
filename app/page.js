'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import LenderInterface from '../components/LenderInterface'
import BorrowerInterface from '../components/BorrowerInterface'
import PoolStatus from '../components/PoolStatus'
import OrderbookVisualizer from '../components/OrderbookVisualizer'
import NetworkValidator from '../components/NetworkValidator'

export default function Home() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('pool')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lending Protocol
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Decentralized lending with orderbook matching
            </p>
          </div>
          
          <div className="w-full max-w-2xl mb-8">
            <NetworkValidator />
          </div>
          
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Lending Protocol
            </h1>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NetworkValidator />
        
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'pool', label: 'Pool Status' },
              { id: 'lend', label: 'Lend' },
              { id: 'borrow', label: 'Borrow' },
              { id: 'orderbook', label: 'Orderbook' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'pool' && <PoolStatus />}
          {activeTab === 'lend' && <LenderInterface />}
          {activeTab === 'borrow' && <BorrowerInterface />}
          {activeTab === 'orderbook' && <OrderbookVisualizer />}
        </div>
      </main>
    </div>
  )
}
