'use client'

import { useState } from 'react'
import DemoLenderInterface from '../components/DemoLenderInterface'
import DemoBorrowerInterface from '../components/DemoBorrowerInterface'
import DemoPoolStatus from '../components/DemoPoolStatus'
import OrderbookVisualizer from '../components/OrderbookVisualizer'

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('pool')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Lending Protocol - Demo Mode
            </h1>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Demo Mode
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Notice */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Mode Active
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a demonstration of the lending protocol. All transactions are simulated.
                  Connect a wallet and deploy contracts to use the real protocol.
                </p>
              </div>
            </div>
          </div>
        </div>

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
          {activeTab === 'pool' && <DemoPoolStatus />}
          {activeTab === 'lend' && <DemoLenderInterface />}
          {activeTab === 'borrow' && <DemoBorrowerInterface />}
          {activeTab === 'orderbook' && <OrderbookVisualizer />}
        </div>
      </main>
    </div>
  )
}
