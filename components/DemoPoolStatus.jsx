'use client'

import { TrendingUp, Users, DollarSign, Activity, Bitcoin, Database, Zap } from 'lucide-react'

export default function DemoPoolStatus() {
  const stats = [
    {
      name: 'Total Available Liquidity',
      value: '100,000',
      unit: 'USDC',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Lent Amount',
      value: '75,000',
      unit: 'USDC',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Active Lenders',
      value: '15',
      unit: '',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Active Borrowers',
      value: '8',
      unit: '',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Average APY',
      value: '3.8',
      unit: '%',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Total Interest Earned',
      value: '2,450',
      unit: 'USDC',
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  const protocolStats = [
    {
      name: 'BTC Collateral Locked',
      value: '5.25',
      unit: 'BTC',
      icon: Bitcoin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Walrus Rewards Pool',
      value: '1,200',
      unit: 'WAL',
      icon: Database,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      name: 'Cross-Chain Loans',
      value: '3',
      unit: '',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Pool Overview */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pool Overview (Demo)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {stat.unit && <span className="text-lg text-gray-500 ml-1">{stat.unit}</span>}
                </div>
                <div className="text-sm text-gray-600">{stat.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pyth Integration Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pyth Network Integration (Demo)</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Reference APY</p>
            <p className="text-sm text-gray-600">Current market rate from Pyth</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              3.8%
            </p>
            <p className="text-sm text-gray-500">Live feed (simulated)</p>
          </div>
        </div>
      </div>

      {/* Protocol Integration Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Integrations (Demo)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocolStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} rounded-lg p-2`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {stat.value}
                      {stat.unit && <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
